// SEED-DATEN — deterministisch & idempotent. `npm run seed` (oder POST /api/dev/reset)
// setzt die DB auf diesen Stand zurück. Zeitstempel sind relativ zu "jetzt".
import { fileURLToPath } from "node:url";
import { getDb, initSchema, DEMO_USER_ID, type DB } from "./db.js";

const now = Date.now();
const DAY = 86_400_000;
const iso = (daysAgo: number, hour = 10) =>
  new Date(now - daysAgo * DAY + (hour - 12) * 3_600_000).toISOString();
const ymd = (daysAgo: number) => new Date(now - daysAgo * DAY).toISOString().slice(0, 10);

export function seed(db: DB): void {
  const wipe = db.transaction(() => {
    // Reihenfolge wegen FK; users-Cascade räumt Kinder ohnehin ab.
    db.prepare("DELETE FROM users WHERE id = ?").run(DEMO_USER_ID);

    db.prepare(
      "INSERT INTO users (id, name, email, member_since, data_residency) VALUES (?,?,?,?,?)",
    ).run(DEMO_USER_ID, "Lena Kessler", "lena.kessler@example.de", "2024-03-01", "Deutschland (Frankfurt)");

    // ── Findings ──────────────────────────────────────────────────────────────
    const f = db.prepare(`INSERT INTO findings
      (id,user_id,title,category,source,sensitivity,risk,exposed_data,discovered,last_seen,status,description,url,actions)
      VALUES (@id,@user_id,@title,@category,@source,@sensitivity,@risk,@exposed_data,@discovered,@last_seen,@status,@description,@url,@actions)`);
    for (const x of FINDINGS) {
      f.run({
        ...x,
        user_id: DEMO_USER_ID,
        exposed_data: JSON.stringify(x.exposedData),
        actions: JSON.stringify(x.actions),
        url: x.url ?? null,
        discovered: x.discoveredDaysAgo === null ? x.discovered! : ymd(x.discoveredDaysAgo),
        last_seen: ymd(x.lastSeenDaysAgo),
      });
    }

    // ── Reputation signals ──────────────────────────────────────────────────────
    const s = db.prepare(
      "INSERT INTO reputation_signals (id,user_id,perspective,label,impact,note) VALUES (?,?,?,?,?,?)",
    );
    SIGNALS.forEach((x, i) =>
      s.run(`sig-${i + 1}`, DEMO_USER_ID, x.perspective, x.label, x.impact, x.note),
    );

    // ── Beneficiaries ────────────────────────────────────────────────────────────
    const b = db.prepare(
      "INSERT INTO beneficiaries (id,user_id,name,relation,email) VALUES (?,?,?,?,?)",
    );
    for (const x of BENEFICIARIES) b.run(x.id, DEMO_USER_ID, x.name, x.relation, x.email);

    // ── Legacy assets ────────────────────────────────────────────────────────────
    const a = db.prepare(`INSERT INTO legacy_assets
      (id,user_id,account,type,value,directive,beneficiary_id,notes)
      VALUES (?,?,?,?,?,?,?,?)`);
    for (const x of ASSETS)
      a.run(x.id, DEMO_USER_ID, x.account, x.type, x.value, x.directive, x.beneficiaryId, x.notes);

    // ── Agents + scopes + activities ──────────────────────────────────────────────
    const ag = db.prepare(
      "INSERT INTO agents (id,user_id,name,vendor,purpose,status,last_active) VALUES (?,?,?,?,?,?,?)",
    );
    const sc = db.prepare(
      "INSERT INTO agent_scopes (id,agent_id,layer,label,granted,last_used) VALUES (?,?,?,?,?,?)",
    );
    const act = db.prepare(
      "INSERT INTO agent_activities (id,agent_id,ts,action,recipient,status) VALUES (?,?,?,?,?,?)",
    );
    for (const x of AGENTS) {
      ag.run(x.id, DEMO_USER_ID, x.name, x.vendor, x.purpose, x.status, iso(x.lastActiveDaysAgo));
      x.scopes.forEach((g, i) =>
        sc.run(
          `${x.id}-sc${i}`,
          x.id,
          g.layer,
          g.label,
          g.granted ? 1 : 0,
          g.lastUsedDaysAgo == null ? null : iso(g.lastUsedDaysAgo),
        ),
      );
      x.activities.forEach((l, i) =>
        act.run(`${x.id}-ac${i}`, x.id, iso(l.daysAgo, l.hour ?? 10), l.action, l.recipient ?? null, l.status),
      );
    }

    // ── Alerts (dashboard events) ──────────────────────────────────────────────────
    const al = db.prepare(
      "INSERT INTO alerts (id,user_id,ts,module,title,detail,severity,related_id) VALUES (?,?,?,?,?,?,?,?)",
    );
    ALERTS.forEach((x, i) =>
      al.run(`alert-${i + 1}`, DEMO_USER_ID, iso(x.daysAgo, x.hour), x.module, x.title, x.detail, x.severity, x.relatedId ?? null),
    );

    // ── Eigene Konten (Profil) ──────────────────────────────────────────────────────
    const oa = db.prepare(
      "INSERT INTO owned_accounts (id,user_id,label,handle,url,email,created_at) VALUES (?,?,?,?,?,?,?)",
    );
    OWNED_ACCOUNTS.forEach((x, i) =>
      oa.run(`own-seed-${i + 1}`, DEMO_USER_ID, x.label, x.handle, x.url, x.email, iso(30 - i)),
    );
    // Zusätzliche, frei gepflegte E-Mail + Namens-Alias (nicht an ein Konto gebunden).
    const setIdentity = db.prepare("INSERT INTO settings (user_id,key,value) VALUES (?,?,?)");
    setIdentity.run(DEMO_USER_ID, "extraEmails", JSON.stringify(["lena.k.alt@example.de"]));
    setIdentity.run(DEMO_USER_ID, "nameAliases", JSON.stringify(["Lena K. Kessler"]));

    // ── Detections (Monitoring — Feature B) ─────────────────────────────────────────
    const det = db.prepare(
      `INSERT INTO detections (id,user_id,ts,platform,title,url,thumbnail,match_type,confidence,status,source)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    );
    DETECTIONS.forEach((x, i) =>
      det.run(
        `det-seed-${i + 1}`, DEMO_USER_ID, iso(x.daysAgo, x.hour), x.platform, x.title, x.url,
        null, x.matchType, x.confidence, x.status, x.source,
      ),
    );

    // ── Settings ────────────────────────────────────────────────────────────────────
    const set = db.prepare(
      "INSERT INTO settings (user_id,key,value) VALUES (?,?,?)",
    );
    set.run(DEMO_USER_ID, "scanFrequency", JSON.stringify("daily"));
    set.run(DEMO_USER_ID, "toggles", JSON.stringify(TOGGLES));
    set.run(DEMO_USER_ID, "verifications", JSON.stringify(VERIFICATIONS));
  });
  wipe();
}

// ────────────────────────────────────────────────────────────────────────────
//  Seed-Inhalte
// ────────────────────────────────────────────────────────────────────────────
type FindingSeed = {
  id: string;
  title: string;
  category: "account" | "broker" | "search" | "leak";
  source: string;
  sensitivity: number;
  risk: "low" | "medium" | "high" | "critical";
  exposedData: string[];
  discoveredDaysAgo: number | null;
  discovered?: string;
  lastSeenDaysAgo: number;
  status: "active" | "dormant" | "removed";
  description: string;
  url?: string;
  actions: string[];
};

const FINDINGS: FindingSeed[] = [
  { id: "find-linkedin", title: "LinkedIn", category: "account", source: "Verknüpftes Konto", sensitivity: 0.3, risk: "low", exposedData: ["Name", "Beruf", "Werdegang", "Foto", "Kontakte"], discoveredDaysAgo: 1220, lastSeenDaysAgo: 2, status: "active", description: "Berufliches Profil mit vollständigem Werdegang. Öffentlich sichtbar, gut gepflegt.", url: "linkedin.com/in/lena-kessler", actions: ["Sichtbarkeit der Kontaktliste prüfen", "Aktivitäts-Broadcast einschränken"] },
  { id: "find-acxiom", title: "Acxiom — Verbraucherprofil", category: "broker", source: "Data-Broker-Abgleich", sensitivity: 0.8, risk: "high", exposedData: ["Name", "Anschrift (Verlauf)", "Kaufkraft-Segment", "Haushaltsgröße", "Interessen-Cluster"], discoveredDaysAgo: 200, lastSeenDaysAgo: 8, status: "active", description: "Aggregiertes Marketing-Profil aus eingekauften Datensätzen mit abgeleiteten Bonitäts- und Konsum-Segmenten.", actions: ["DSGVO-Auskunft anfragen", "Opt-out / Widerspruch einreichen"] },
  { id: "find-schufa", title: "SCHUFA", category: "broker", source: "Auskunftei", sensitivity: 0.7, risk: "medium", exposedData: ["Name", "Geburtsdatum", "Anschrift", "Score-Wert", "Vertragsdaten"], discoveredDaysAgo: 320, lastSeenDaysAgo: 21, status: "active", description: "Bonitätsdatensatz mit aktuellem Basisscore. Mehrere meldende Vertragspartner hinterlegt.", actions: ["Kostenlose Datenkopie (§34 BDSG) anfordern"] },
  { id: "find-leak-collection", title: "Daten-Leak — „Collection #5\"", category: "leak", source: "Breach-Monitoring", sensitivity: 0.95, risk: "critical", exposedData: ["E-Mail", "Passwort-Hash", "Klartext-Passwort (alt)", "IP-Adresse"], discoveredDaysAgo: 9, lastSeenDaysAgo: 9, status: "active", description: "Deine private E-Mail taucht in einer kombinierten Zugangsdaten-Sammlung auf. Ein altes Passwort liegt im Klartext vor.", actions: ["Passwort überall ändern", "2-Faktor-Authentifizierung aktivieren"] },
  { id: "find-yasni", title: "Yasni — Personensuche", category: "search", source: "Suchmaschinen-Treffer", sensitivity: 0.5, risk: "medium", exposedData: ["Name", "frühere Arbeitgeber", "Wohnort", "verlinkte Profile"], discoveredDaysAgo: 100, lastSeenDaysAgo: 16, status: "active", description: "Personen-Aggregator bündelt öffentlich auffindbare Treffer zu einem Profil. Teils veraltet.", url: "yasni.de/lena+kessler", actions: ["Eintrag-Korrektur beantragen", "Löschung veralteter Treffer"] },
  { id: "find-google", title: "Google-Konto", category: "account", source: "Verknüpftes Konto", sensitivity: 0.6, risk: "medium", exposedData: ["E-Mail", "Standortverlauf", "Suchverlauf", "YouTube-Aktivität", "Fotos"], discoveredDaysAgo: 1500, lastSeenDaysAgo: 0, status: "active", description: "Zentrales Konto mit umfangreicher Aktivitätshistorie. Standortverlauf reicht Jahre zurück.", actions: ["Standortverlauf pausieren", "Auto-Löschung auf 3 Monate stellen"] },
  { id: "find-meta", title: "Meta (Instagram)", category: "account", source: "Verknüpftes Konto", sensitivity: 0.35, risk: "low", exposedData: ["Name", "Fotos", "Follower-Graph", "Standort-Tags"], discoveredDaysAgo: 800, lastSeenDaysAgo: 3, status: "active", description: "Privates Profil. Wenige öffentliche Beiträge, Standort-Tags teils aktiv.", actions: ["Alte Standort-Tags entfernen"] },
  { id: "find-spokeo", title: "Spokeo — People Search", category: "broker", source: "Data-Broker-Abgleich", sensitivity: 0.85, risk: "high", exposedData: ["Name", "Telefonnummer", "Anschrift", "Verwandte", "Alter"], discoveredDaysAgo: 56, lastSeenDaysAgo: 12, status: "active", description: "US-Datenhändler bietet kostenpflichtige Detailberichte mit Telefonnummer und Verwandten-Verknüpfung an.", actions: ["Opt-out-Formular einreichen"] },
  { id: "find-xing", title: "XING", category: "account", source: "Suchmaschinen-Treffer", sensitivity: 0.25, risk: "low", exposedData: ["Name", "Beruf", "Branche"], discoveredDaysAgo: 1100, lastSeenDaysAgo: 80, status: "dormant", description: "Verwaistes Karriere-Profil. Seit über einem Jahr inaktiv, aber öffentlich.", url: "xing.com/profile/Lena_Kessler", actions: ["Profil deaktivieren oder aktualisieren"] },
  { id: "find-forum", title: "Hobbykoch-Forum (2009)", category: "search", source: "Suchmaschinen-Treffer", sensitivity: 0.2, risk: "low", exposedData: ["Pseudonym", "E-Mail (alt)", "Beiträge"], discoveredDaysAgo: 199, lastSeenDaysAgo: 120, status: "active", description: "Alte Forenbeiträge unter Pseudonym, über die alte E-Mail verknüpfbar. Geringe Tragweite.", actions: ["Account-Löschung beim Betreiber anfragen"] },
  { id: "find-leak-travel", title: "Data-Leak — Reisebuchungs-Portal", category: "leak", source: "Breach-Monitoring", sensitivity: 0.7, risk: "high", exposedData: ["Name", "E-Mail", "Reiseziele", "Buchungsdaten"], discoveredDaysAgo: 154, lastSeenDaysAgo: 154, status: "active", description: "Kundendatenbank eines Buchungsportals wurde offengelegt. Keine Zahlungsdaten, aber Reiseverhalten ableitbar.", actions: ["Phishing-Wachsamkeit erhöhen", "Konto beim Portal schließen"] },
  { id: "find-leak-fitness", title: "Data-Leak — Fitness-App", category: "leak", source: "Breach-Monitoring", sensitivity: 0.65, risk: "medium", exposedData: ["Name", "E-Mail", "Geburtsdatum", "Gewicht/Gesundheitswerte"], discoveredDaysAgo: 239, lastSeenDaysAgo: 239, status: "active", description: "Eine Fitness-Tracking-App hat Nutzerdaten offengelegt, inkl. abgeleiteter Gesundheitswerte.", actions: ["Konto bei der App schließen", "Gesundheitsdaten-Freigaben prüfen"] },
  { id: "find-pinterest", title: "Pinterest", category: "account", source: "Verknüpftes Konto", sensitivity: 0.15, risk: "low", exposedData: ["Name", "Interessen", "Pinnwände"], discoveredDaysAgo: 1300, lastSeenDaysAgo: 220, status: "dormant", description: "Kaum genutztes Konto. Pinnwände geben Interessen preis, aber unkritisch.", actions: [] },
];

type SignalSeed = { perspective: "recruiter" | "insurer" | "public"; label: string; impact: "positive" | "neutral" | "negative"; note: string };
const SIGNALS: SignalSeed[] = [
  { perspective: "recruiter", label: "LinkedIn vollständig & gepflegt", impact: "positive", note: "Lückenloser Werdegang, klare Rollenbeschreibung." },
  { perspective: "recruiter", label: "Fachbeiträge auffindbar", impact: "positive", note: "Zwei zitierte Artikel stärken die Glaubwürdigkeit." },
  { perspective: "recruiter", label: "Verwaistes XING-Profil", impact: "negative", note: "Veraltete Angaben können widersprüchlich wirken." },
  { perspective: "insurer", label: "Acxiom-Konsumsegmente", impact: "negative", note: "Abgeleitete Risiko- und Kaufkraft-Merkmale ohne dein Zutun." },
  { perspective: "insurer", label: "Aktiver Standortverlauf", impact: "negative", note: "Mobilitätsmuster sind potenziell für Tarifierung relevant." },
  { perspective: "insurer", label: "Keine öffentlichen Gesundheitsdaten", impact: "positive", note: "Keine sensiblen medizinischen Spuren öffentlich auffindbar." },
  { perspective: "public", label: "Klartext-Passwort im Leak", impact: "negative", note: "Kritisch, falls anderswo wiederverwendet." },
  { perspective: "public", label: "Spokeo: Telefon + Verwandte", impact: "negative", note: "Erleichtert gezieltes Social Engineering." },
  { perspective: "public", label: "Name häufig — gewisse Verdünnung", impact: "positive", note: "Mehrere Namensvettern erschweren eindeutige Zuordnung." },
];

const BENEFICIARIES = [
  { id: "ben-1", name: "Jonas Kessler", relation: "Bruder", email: "jonas.k@example.de" },
  { id: "ben-2", name: "Marlene Vogt", relation: "Partnerin", email: "m.vogt@example.de" },
  { id: "ben-3", name: "Dr. Anke Reimann", relation: "Notarin", email: "kanzlei@reimann-notar.de" },
];

type AssetSeed = { id: string; account: string; type: "social" | "financial" | "email" | "cloud" | "subscription" | "crypto"; value: string; directive: "memorialize" | "transfer" | "delete" | "undecided"; beneficiaryId: string | null; notes: string };
const ASSETS: AssetSeed[] = [
  { id: "leg-google", account: "Google-Konto", type: "email", value: "E-Mail, Fotos (12 Jahre), Dokumente", directive: "transfer", beneficiaryId: "ben-2", notes: "Familienfotos an Marlene übergeben, danach Konto schließen." },
  { id: "leg-instagram", account: "Instagram", type: "social", value: "Privates Profil, ~400 Beiträge", directive: "memorialize", beneficiaryId: "ben-1", notes: "In Gedenkzustand versetzen, keine neuen Logins." },
  { id: "leg-bank", account: "DKB Girokonto", type: "financial", value: "Girokonto, Daueraufträge", directive: "transfer", beneficiaryId: "ben-3", notes: "Abwicklung über Notariat Reimann. Vollmacht hinterlegt." },
  { id: "leg-crypto", account: "Ledger Wallet", type: "crypto", value: "Kryptowerte (Seed-Phrase offline)", directive: "transfer", beneficiaryId: "ben-1", notes: "Seed-Phrase im Bankschließfach. Zugang nur über Notariat." },
  { id: "leg-linkedin", account: "LinkedIn", type: "social", value: "Berufliches Profil", directive: "delete", beneficiaryId: null, notes: "Vollständig löschen." },
  { id: "leg-spotify", account: "Spotify Premium", type: "subscription", value: "Abo, Playlists", directive: "delete", beneficiaryId: null, notes: "Abo kündigen, Playlists vorher exportieren." },
  { id: "leg-dropbox", account: "Dropbox", type: "cloud", value: "Archiv, Projektdateien", directive: "undecided", beneficiaryId: null, notes: "" },
];

type AgentSeed = {
  id: string; name: string; vendor: string; purpose: string;
  status: "active" | "paused" | "anomaly"; lastActiveDaysAgo: number;
  scopes: { layer: 0 | 1 | 2 | 3 | 4; label: string; granted: boolean; lastUsedDaysAgo: number | null }[];
  activities: { daysAgo: number; hour?: number; action: string; recipient?: string; status: "ok" | "flagged" }[];
};
const AGENTS: AgentSeed[] = [
  {
    id: "ag-shopping", name: "Beschaffungs-Assistent", vendor: "Mercato AI",
    purpose: "Vergleicht Preise und tätigt freigegebene Käufe bis 150 €.",
    status: "active", lastActiveDaysAgo: 0,
    scopes: [
      { layer: 0, label: "Identitätsnachweis nutzen", granted: true, lastUsedDaysAgo: 0 },
      { layer: 1, label: "Bestellhistorie lesen", granted: true, lastUsedDaysAgo: 1 },
      { layer: 2, label: "Zahlungen bis 150 € auslösen", granted: true, lastUsedDaysAgo: 1 },
      { layer: 2, label: "Konto-Stammdaten ändern", granted: false, lastUsedDaysAgo: null },
    ],
    activities: [
      { daysAgo: 0, hour: 8, action: "Preisvergleich für „Kaffeebohnen 1 kg\"", status: "ok" },
      { daysAgo: 1, hour: 18, action: "Bestellung ausgelöst — 23,90 €", status: "ok" },
      { daysAgo: 3, action: "Warenkorb aktualisiert", status: "ok" },
    ],
  },
  {
    id: "ag-travel", name: "Reise-Planer", vendor: "Voyage Copilot",
    purpose: "Sucht und reserviert Reisen im Rahmen deiner Vorgaben.",
    status: "anomaly", lastActiveDaysAgo: 1,
    scopes: [
      { layer: 1, label: "Kalender lesen", granted: true, lastUsedDaysAgo: 2 },
      { layer: 1, label: "Kontakte lesen", granted: true, lastUsedDaysAgo: 1 },
      { layer: 2, label: "Reisen reservieren (ohne Zahlung)", granted: true, lastUsedDaysAgo: 3 },
      { layer: 2, label: "Zahlungen auslösen", granted: false, lastUsedDaysAgo: null },
      { layer: 3, label: "Reisedaten zum Training freigeben", granted: true, lastUsedDaysAgo: 2 },
    ],
    activities: [
      { daysAgo: 1, hour: 23, action: "Zahlungsversuch 612 € außerhalb erlaubter Scopes", recipient: "booking-gateway", status: "flagged" },
      { daysAgo: 1, hour: 23, action: "Zugriff auf Kontakte um 23:47 (untypische Zeit)", status: "flagged" },
      { daysAgo: 2, hour: 9, action: "Hotelsuche Lissabon", status: "ok" },
    ],
  },
  {
    id: "ag-inbox", name: "Posteingangs-Sortierer", vendor: "Eigenbetrieb (lokal)",
    purpose: "Kategorisiert E-Mails und entwirft Antworten zur Freigabe.",
    status: "active", lastActiveDaysAgo: 0,
    scopes: [
      { layer: 1, label: "E-Mails lesen", granted: true, lastUsedDaysAgo: 0 },
      { layer: 2, label: "Labels setzen", granted: true, lastUsedDaysAgo: 0 },
      { layer: 2, label: "Entwürfe erstellen", granted: true, lastUsedDaysAgo: 0 },
      { layer: 2, label: "E-Mails senden", granted: false, lastUsedDaysAgo: null },
    ],
    activities: [
      { daysAgo: 0, hour: 8, action: "14 E-Mails kategorisiert", status: "ok" },
      { daysAgo: 0, hour: 8, action: "2 Antwort-Entwürfe erstellt", status: "ok" },
    ],
  },
  {
    id: "ag-subs", name: "Abo-Manager", vendor: "Mercato AI",
    purpose: "Überwacht Abos und kündigt ungenutzte nach Freigabe.",
    status: "paused", lastActiveDaysAgo: 220,
    scopes: [
      { layer: 1, label: "Abrechnungs-E-Mails lesen", granted: true, lastUsedDaysAgo: 220 },
      { layer: 3, label: "Zahlungs-Token gespeichert", granted: true, lastUsedDaysAgo: 240 },
      { layer: 2, label: "Kündigungen einreichen", granted: false, lastUsedDaysAgo: null },
    ],
    activities: [
      { daysAgo: 220, action: "3 ungenutzte Abos erkannt", status: "ok" },
      { daysAgo: 220, action: "Vom Nutzer pausiert", status: "ok" },
    ],
  },
];

type AlertSeed = { daysAgo: number; hour: number; module: string; title: string; detail: string; severity: "info" | "ok" | "warn" | "danger"; relatedId?: string };
const ALERTS: AlertSeed[] = [
  { daysAgo: 1, hour: 23, module: "Agenten-Monitoring", title: "Anomalie beim Reise-Planer", detail: "Zahlungsversuch außerhalb erlaubter Scopes und Zugriff zu untypischer Zeit.", severity: "danger", relatedId: "ag-travel" },
  { daysAgo: 9, hour: 19, module: "Identitäts-Inventar", title: "Neuer Daten-Leak gefunden", detail: "Deine E-Mail erscheint in „Collection #5\" inkl. altem Klartext-Passwort.", severity: "danger", relatedId: "find-leak-collection" },
  { daysAgo: 8, hour: 11, module: "Datenrechte", title: "Acxiom hat Auskunft bestätigt", detail: "Eingangsbestätigung erhalten. Frist für Vollauskunft läuft.", severity: "info" },
  { daysAgo: 12, hour: 14, module: "Identitäts-Inventar", title: "Spokeo-Eintrag aktualisiert", detail: "Telefonnummer und Verwandten-Verknüpfung neu sichtbar.", severity: "warn", relatedId: "find-spokeo" },
  { daysAgo: 16, hour: 9, module: "Wahrnehmung", title: "Recruiter-Einschätzung verbessert", detail: "Aktualisiertes LinkedIn-Profil wirkt sich positiv aus.", severity: "ok" },
  { daysAgo: 21, hour: 16, module: "Datenrechte", title: "SCHUFA-Datenkopie eingegangen", detail: "Basisscore und gemeldete Vertragspartner einsehbar.", severity: "ok" },
];

type OwnedAccountSeed = { label: string; handle: string | null; url: string | null; email: string | null };
const OWNED_ACCOUNTS: OwnedAccountSeed[] = [
  { label: "LinkedIn", handle: "lena-kessler", url: "https://linkedin.com/in/lena-kessler", email: "lena.kessler@example.de" },
  { label: "Instagram", handle: "lena.kessler", url: "https://instagram.com/lena.kessler", email: null },
  { label: "Google", handle: null, url: null, email: "lena.kessler@gmail.com" },
  { label: "XING", handle: "Lena_Kessler", url: "https://xing.com/profile/Lena_Kessler", email: null },
];

type DetectionSeed = {
  daysAgo: number; hour: number; platform: string; title: string; url: string;
  matchType: "image" | "name"; confidence: number; status: "new" | "reviewed" | "takedown_requested" | "dismissed"; source: string;
};
const DETECTIONS: DetectionSeed[] = [
  { daysAgo: 1, hour: 14, platform: "instagram.com", title: "Profil „lena.kesssler_\" verwendet dein Foto", url: "https://instagram.com/lena.kesssler_", matchType: "image", confidence: 0.93, status: "new", source: "Referenz-Abgleich" },
  { daysAgo: 3, hour: 9, platform: "facebook.com", title: "Facebook-Konto mit deinem Profilbild", url: "https://facebook.com/people/lena.kessler.fake", matchType: "image", confidence: 0.81, status: "new", source: "Referenz-Abgleich" },
  { daysAgo: 6, hour: 18, platform: "blog.example", title: "Lena Kessler — Erwähnung in Blogbeitrag", url: "https://blog.example/2026/05/event", matchType: "name", confidence: 0.42, status: "reviewed", source: "Suchmaschinen-Treffer" },
  // Eigenes, bekanntes Konto (deckt sich mit der LinkedIn-Fundstelle) → wird beim
  // Abgleich als isKnown markiert und aus der Fake-Liste herausgerechnet.
  { daysAgo: 2, hour: 11, platform: "linkedin.com", title: "Lena Kessler — LinkedIn (dein Profil)", url: "https://linkedin.com/in/lena-kessler", matchType: "image", confidence: 0.9, status: "new", source: "Referenz-Abgleich" },
];

const TOGGLES: Record<string, boolean> = {
  "local-first": true,
  e2e: true,
  "ml-consent": true,
  "broker-autoscan": false,
};

const VERIFICATIONS = [
  { id: "email", label: "E-Mail", status: "verified", detail: "lena.kessler@example.de" },
  { id: "phone", label: "Telefonnummer", status: "verified", detail: "+49 151 ••• ••72" },
  { id: "eid", label: "Personalausweis (eID)", status: "verified", detail: "Verifiziert am 04.03.2024" },
  { id: "address", label: "Wohnanschrift", status: "pending", detail: "Nachweis hochgeladen — in Prüfung" },
  { id: "biometric", label: "Biometrischer Referenz-Hash", status: "unverified", detail: "Für Deepfake-Abgleich — noch nicht hinterlegt" },
];

// Direkt ausführbar: `npm run seed`
const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  const db = getDb();
  initSchema(db);
  seed(db);
  const n = db.prepare("SELECT COUNT(*) c FROM findings").get() as { c: number };
  console.log(`✓ Seed abgeschlossen — ${n.c} Findings für ${DEMO_USER_ID}.`);
}
