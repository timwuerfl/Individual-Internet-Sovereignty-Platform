// SerpAPI-Anbindung (Feature B — Fake-Account-/Bild-Monitoring).
//
// • Reverse-Image: engine=google_lens (Referenzbild → visuell ähnliche Treffer)
// • Postings/Namen: engine=google (Textsuche → organische Treffer)
//
// Echte Abfrage, wenn SERPAPI_KEY gesetzt ist; sonst deterministischer Mock,
// damit die Demo ohne Key läuft. Confidence ist eine HEURISTIK (SerpAPI liefert
// keinen Score): Rang + Bonus für Social-Plattformen.
import type { Detection, DetectionMatchType } from "@icp/shared";
import type { DB } from "../db.js";
import { ApiErr } from "./errors.js";
import { config } from "./config.js";
import { httpGet } from "./http.js";
import { cacheGet, cacheSet } from "./cache.js";

export type ScanMode = "image" | "name" | "both";
export interface MonitoringScan {
  mode: ScanMode;
  detections: Detection[];
  mock: boolean;
}

const SOCIAL = [
  "instagram.com", "facebook.com", "tiktok.com", "x.com", "twitter.com",
  "vk.com", "threads.net", "linkedin.com", "snapchat.com", "onlyfans.com",
];

function platformOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "unbekannt";
  }
}

// Stabiler Hash → stabile IDs (idempotenter Upsert über mehrere Scans).
function hash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

function imageConfidence(position: number, platform: string): number {
  let c = Math.max(0.45, 0.92 - (position - 1) * 0.05);
  if (SOCIAL.some((s) => platform === s || platform.endsWith(`.${s}`))) c = Math.min(0.98, c + 0.06);
  return Math.round(c * 100) / 100;
}
function nameConfidence(position: number): number {
  return Math.round(Math.max(0.3, 0.6 - (position - 1) * 0.04) * 100) / 100;
}

function toDetection(
  matchType: DetectionMatchType,
  position: number,
  title: string,
  url: string,
  thumbnail: string | null,
  source: string,
  ts: string,
): Detection {
  const platform = platformOf(url);
  return {
    id: `det-${matchType[0]}-${hash(url)}`,
    ts,
    platform,
    title: title || platform,
    url,
    thumbnail,
    matchType,
    confidence: matchType === "image" ? imageConfidence(position, platform) : nameConfidence(position),
    status: "new",
    source,
    isKnown: false, // wird im Monitoring-Modul gegen die bekannten Konten gesetzt
  };
}

// ── SerpAPI-Antwort-Typen (nur genutzte Felder) ─────────────────────────────────
interface LensMatch { position?: number; title?: string; link?: string; thumbnail?: string }
interface OrganicResult { position?: number; title?: string; link?: string }

async function serpApi<T>(db: DB, params: Record<string, string>): Promise<T> {
  const qs = new URLSearchParams({ ...params, api_key: config.serpapi.key!, no_cache: "false" });
  // Cache-Key ohne den Key (sonst landet das Secret in der DB).
  const cacheKey = `serpapi:${new URLSearchParams(params).toString()}`;
  const cached = cacheGet<T>(db, cacheKey);
  if (cached) return cached;

  const res = await httpGet(`https://serpapi.com/search.json?${qs.toString()}`);
  if (res.status === 401) throw new ApiErr(502, "serpapi_auth", "SerpAPI-Key ungültig.");
  if (res.status === 429) throw new ApiErr(429, "rate_limited", "SerpAPI-Kontingent erschöpft.");
  if (!res.ok) throw new ApiErr(502, "serpapi_error", `SerpAPI-Fehler (HTTP ${res.status}).`);
  const json = (await res.json()) as T;
  cacheSet(db, cacheKey, json);
  return json;
}

const LIMIT = 12;
const MAX_TEXT_QUERIES = 6; // Quota-Schutz: max. Anzahl Text-Suchen pro Scan

export async function scanMonitoring(
  db: DB,
  args: { imageUrl?: string; name?: string; terms?: string[] },
): Promise<MonitoringScan> {
  const ts = new Date().toISOString();
  // Text-Suchbegriffe = name + terms (dedupliziert, begrenzt).
  const queries = [...new Set([...(args.name ? [args.name] : []), ...(args.terms ?? [])].map((s) => s.trim()).filter(Boolean))].slice(
    0,
    MAX_TEXT_QUERIES,
  );
  const mode: ScanMode = args.imageUrl && queries.length ? "both" : args.imageUrl ? "image" : "name";

  if (!config.serpapi.enabled) {
    return { mode, mock: true, detections: mockDetections(mode, queries[0], ts) };
  }

  const byId = new Map<string, Detection>();

  if (args.imageUrl) {
    const data = await serpApi<{ visual_matches?: LensMatch[] }>(db, { engine: "google_lens", url: args.imageUrl });
    (data.visual_matches ?? []).slice(0, LIMIT).forEach((m, i) => {
      if (!m.link) return;
      const d = toDetection("image", m.position ?? i + 1, m.title ?? "", m.link, m.thumbnail ?? null, "SerpAPI · Google Lens", ts);
      byId.set(d.id, d);
    });
  }

  for (const q of queries) {
    const data = await serpApi<{ organic_results?: OrganicResult[] }>(db, { engine: "google", q });
    (data.organic_results ?? []).slice(0, LIMIT).forEach((r, i) => {
      if (!r.link) return;
      const d = toDetection("name", r.position ?? i + 1, r.title ?? "", r.link, null, `SerpAPI · Google („${q}")`, ts);
      // Bei mehreren Begriffen denselben Treffer nicht doppelt zählen.
      if (!byId.has(d.id)) byId.set(d.id, d);
    });
  }

  return { mode, mock: false, detections: [...byId.values()] };
}

// ── Deterministische Demo-Treffer (Mock-Modus) ─────────────────────────────────
function mockDetections(mode: ScanMode, name: string | undefined, ts: string): Detection[] {
  const who = (name ?? "Lena Kessler").toLowerCase().replace(/\s+/g, ".");
  const out: Detection[] = [];
  if (mode === "image" || mode === "both") {
    out.push(
      toDetection("image", 1, `Profil „${who}_" verwendet dein Foto`, `https://instagram.com/${who}_`, null, "SerpAPI · Google Lens (Mock)", ts),
      toDetection("image", 2, "Facebook-Konto mit deinem Profilbild", `https://facebook.com/people/${who}`, null, "SerpAPI · Google Lens (Mock)", ts),
      toDetection("image", 4, "Bild auf Marktplatz-Inserat gefunden", "https://kleinanzeigen.example/inserat/8842", null, "SerpAPI · Google Lens (Mock)", ts),
    );
  }
  if (mode === "name" || mode === "both") {
    out.push(
      toDetection("name", 1, `${name ?? "Lena Kessler"} — Kommentar in News-Forum`, "https://forum.example/thread/91", null, "SerpAPI · Google (Mock)", ts),
      toDetection("name", 3, `Erwähnung in Blogbeitrag`, "https://blog.example/2026/05/event", null, "SerpAPI · Google (Mock)", ts),
    );
  }
  return out;
}
