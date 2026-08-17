// HaveIBeenPwned-Anbindung (Feature A — Leak-Scan).
// Echte Abfrage, wenn HIBP_API_KEY gesetzt ist; sonst deterministischer Mock,
// damit die Demo auch ohne Key läuft. Treffer werden auf IdentityFinding
// (Kategorie "leak") gemappt und fließen so direkt in Inventar + Exposure-Score.
import type { IdentityFinding, RiskLevel } from "@icp/shared";
import type { DB } from "../db.js";
import { ApiErr } from "./errors.js";
import { config } from "./config.js";
import { httpGet } from "./http.js";
import { cacheGet, cacheSet } from "./cache.js";

interface HibpBreach {
  Name: string;
  Title: string;
  Domain: string;
  BreachDate: string; // yyyy-mm-dd
  Description: string; // HTML
  DataClasses: string[];
  IsVerified?: boolean;
  IsSensitive?: boolean;
  PwnCount?: number;
}

export interface HibpScan {
  email: string;
  findings: IdentityFinding[];
  mock: boolean;
}

const DATA_CLASS_DE: Record<string, string> = {
  "Email addresses": "E-Mail-Adressen",
  Passwords: "Passwörter",
  Usernames: "Benutzernamen",
  "Phone numbers": "Telefonnummern",
  "Physical addresses": "Anschriften",
  "Dates of birth": "Geburtsdaten",
  Names: "Namen",
  "IP addresses": "IP-Adressen",
  "Geographic locations": "Standorte",
  Genders: "Geschlecht",
  "Credit cards": "Kreditkartendaten",
  "Social media profiles": "Social-Media-Profile",
  "Account balances": "Kontostände",
  "Security questions and answers": "Sicherheitsfragen",
};
const deClass = (c: string): string => DATA_CLASS_DE[c] ?? c;

const stripHtml = (s: string): string =>
  s.replace(/<[^>]*>/g, "").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim();

function riskFor(b: HibpBreach): RiskLevel {
  const dc = b.DataClasses.map((x) => x.toLowerCase());
  if (dc.some((x) => x.includes("password") || x.includes("credit card"))) return "critical";
  if (dc.some((x) => x.includes("phone") || x.includes("physical address") || x.includes("date of birth")))
    return "high";
  if (dc.length >= 4 || b.IsSensitive) return "medium";
  return "low";
}

function sensitivityFor(b: HibpBreach): number {
  const dc = b.DataClasses.map((x) => x.toLowerCase());
  let s = 0.4;
  if (dc.some((x) => x.includes("password"))) s = 0.95;
  else if (dc.some((x) => x.includes("credit card"))) s = 0.9;
  else if (dc.some((x) => x.includes("phone") || x.includes("physical address"))) s = 0.75;
  else s = Math.min(0.85, 0.4 + dc.length * 0.08);
  if (b.IsSensitive) s = Math.max(s, 0.85);
  return Math.round(s * 100) / 100;
}

// Pure Mapping-Funktion (auch direkt testbar).
export function breachToFinding(b: HibpBreach, today: string): IdentityFinding {
  const dc = b.DataClasses.map((x) => x.toLowerCase());
  const hasPw = dc.some((x) => x.includes("password"));
  return {
    id: `find-leak-hibp-${b.Name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    title: `Daten-Leak — ${b.Title}`,
    category: "leak",
    source: `HaveIBeenPwned · ${b.Domain || b.Name}`,
    sensitivity: sensitivityFor(b),
    risk: riskFor(b),
    exposedData: b.DataClasses.map(deClass),
    discovered: b.BreachDate || today,
    lastSeen: today,
    status: "active",
    description: stripHtml(b.Description).slice(0, 400),
    url: b.Domain || undefined,
    actions: hasPw
      ? ["Passwort überall ändern", "2-Faktor-Authentifizierung aktivieren"]
      : ["Betroffenes Konto prüfen", "Phishing-Wachsamkeit erhöhen"],
  };
}

// Realistische Demo-Treffer für den Mock-Modus (ohne Key).
const MOCK_BREACHES: HibpBreach[] = [
  {
    Name: "Collection1", Title: "Collection #1", Domain: "", BreachDate: "2019-01-07",
    Description: "In January 2019, a large collection of credential stuffing lists was discovered, containing email addresses and passwords in plain text.",
    DataClasses: ["Email addresses", "Passwords"], IsVerified: true, PwnCount: 772904991,
  },
  {
    Name: "LinkedIn", Title: "LinkedIn", Domain: "linkedin.com", BreachDate: "2012-05-05",
    Description: "In May 2012, LinkedIn was breached and the passwords of 164 million accounts were exposed.",
    DataClasses: ["Email addresses", "Passwords"], IsVerified: true, PwnCount: 164611595,
  },
  {
    Name: "Dropbox", Title: "Dropbox", Domain: "dropbox.com", BreachDate: "2012-07-01",
    Description: "In mid-2012, Dropbox suffered a data breach which exposed the stored credentials of tens of millions of their customers.",
    DataClasses: ["Email addresses", "Passwords"], IsVerified: true, PwnCount: 68648009,
  },
];

export async function scanBreaches(db: DB, email: string): Promise<HibpScan> {
  const today = new Date().toISOString().slice(0, 10);

  if (!config.hibp.enabled) {
    return { email, findings: MOCK_BREACHES.map((b) => breachToFinding(b, today)), mock: true };
  }

  const cacheKey = `hibp:${email.toLowerCase()}`;
  let breaches = cacheGet<HibpBreach[]>(db, cacheKey);
  if (!breaches) {
    const res = await httpGet(
      `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}?truncateResponse=false`,
      { headers: { "hibp-api-key": config.hibp.key! } },
    );
    if (res.status === 404) breaches = [];
    else if (res.status === 401) throw new ApiErr(502, "hibp_auth", "HIBP-API-Key ungültig oder fehlt.");
    else if (res.status === 429)
      throw new ApiErr(429, "rate_limited", "HIBP-Rate-Limit erreicht — bitte später erneut scannen.");
    else if (!res.ok) throw new ApiErr(502, "hibp_error", `HIBP-Fehler (HTTP ${res.status}).`);
    else breaches = (await res.json()) as HibpBreach[];
    cacheSet(db, cacheKey, breaches);
  }

  return { email, findings: breaches.map((b) => breachToFinding(b, today)), mock: false };
}
