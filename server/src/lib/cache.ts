// TTL-Cache für externe API-Antworten (Tabelle external_cache). Spart bezahlte
// Quota und wirkt als sanftes Rate-Limit: identische Anfragen treffen den Cache.
import type { DB } from "../db.js";
import { config } from "./config.js";

export function cacheGet<T>(db: DB, key: string): T | null {
  const row = db
    .prepare("SELECT value, fetched_at FROM external_cache WHERE key = ?")
    .get(key) as { value: string; fetched_at: number } | undefined;
  if (!row) return null;
  if (Date.now() - row.fetched_at > config.cacheTtlMs) return null;
  try {
    return JSON.parse(row.value) as T;
  } catch {
    return null;
  }
}

export function cacheSet(db: DB, key: string, value: unknown): void {
  db.prepare(
    `INSERT INTO external_cache (key, value, fetched_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, fetched_at = excluded.fetched_at`,
  ).run(key, JSON.stringify(value), Date.now());
}
