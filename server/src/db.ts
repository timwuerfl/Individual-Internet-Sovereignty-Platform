import Database from "better-sqlite3";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mkdirSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

export type DB = Database.Database;

export const DEFAULT_DB_PATH =
  process.env.ICP_DB_PATH ?? join(__dirname, "..", "data", "dev.db");

// Demo: ein einziger Nutzer. Schema ist multi-user-fähig (user_id überall).
export const DEMO_USER_ID = "user-demo";

export function openDb(path: string = DEFAULT_DB_PATH): DB {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  return db;
}

// Idempotentes Schema. Mock-Module (DataRights, Monitoring, Connected-Apps-
// Aggregation) bekommen bewusst KEINE Tabellen — sie bleiben Frontend-Fixtures.
export function initSchema(db: DB): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      member_since TEXT NOT NULL,
      data_residency TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS findings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      source TEXT NOT NULL,
      sensitivity REAL NOT NULL,
      risk TEXT NOT NULL,
      exposed_data TEXT NOT NULL,
      discovered TEXT NOT NULL,
      last_seen TEXT NOT NULL,
      status TEXT NOT NULL,
      description TEXT NOT NULL,
      url TEXT,
      actions TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reputation_signals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      perspective TEXT NOT NULL,
      label TEXT NOT NULL,
      impact TEXT NOT NULL,
      note TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS beneficiaries (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      relation TEXT NOT NULL,
      email TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS legacy_assets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      account TEXT NOT NULL,
      type TEXT NOT NULL,
      value TEXT NOT NULL,
      directive TEXT NOT NULL,
      beneficiary_id TEXT,
      notes TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      vendor TEXT NOT NULL,
      purpose TEXT NOT NULL,
      status TEXT NOT NULL,
      last_active TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS agent_scopes (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
      layer INTEGER NOT NULL,
      label TEXT NOT NULL,
      granted INTEGER NOT NULL,
      last_used TEXT
    );

    CREATE TABLE IF NOT EXISTS agent_activities (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
      ts TEXT NOT NULL,
      action TEXT NOT NULL,
      recipient TEXT,
      status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      ts TEXT NOT NULL,
      module TEXT NOT NULL,
      title TEXT NOT NULL,
      detail TEXT NOT NULL,
      severity TEXT NOT NULL,
      related_id TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      PRIMARY KEY (user_id, key)
    );

    -- TTL-Cache für externe API-Antworten (HIBP, SerpAPI). Nicht nutzergebunden.
    CREATE TABLE IF NOT EXISTS external_cache (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      fetched_at INTEGER NOT NULL
    );

    -- Eigene Konten/Identifikatoren des Nutzers (für Leak- & Fake-Account-Scan,
    -- ohne Passwörter). Speist die Suche und den Eigen-Konto-Abgleich.
    CREATE TABLE IF NOT EXISTS owned_accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      label TEXT NOT NULL,
      handle TEXT,
      url TEXT,
      email TEXT,
      created_at TEXT NOT NULL
    );

    -- Monitoring-Treffer (Feature B): Bild-/Namens-Funde aus der SerpAPI-Suche.
    CREATE TABLE IF NOT EXISTS detections (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      ts TEXT NOT NULL,
      platform TEXT NOT NULL,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      thumbnail TEXT,
      match_type TEXT NOT NULL,
      confidence REAL NOT NULL,
      status TEXT NOT NULL,
      source TEXT NOT NULL
    );
  `);
}

// Singleton für den laufenden Server.
let _db: DB | null = null;
export function getDb(): DB {
  if (!_db) {
    _db = openDb();
    initSchema(_db);
  }
  return _db;
}
