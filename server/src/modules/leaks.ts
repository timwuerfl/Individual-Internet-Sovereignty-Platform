import type { FastifyInstance } from "fastify";
import { LeakScanRequest, type IdentityFinding } from "@icp/shared";
import type { DB } from "../db.js";
import { DEMO_USER_ID } from "../db.js";
import { toFinding } from "../lib/rows.js";
import { ApiErr } from "../lib/errors.js";
import { scanBreaches } from "../lib/hibp.js";
import { loadIdentity } from "../lib/identity.js";

export function registerLeaks(app: FastifyInstance, db: DB) {
  const getSetting = (key: string): string | null => {
    const row = db.prepare("SELECT value FROM settings WHERE user_id = ? AND key = ?").get(DEMO_USER_ID, key) as
      | { value: string }
      | undefined;
    return row ? (JSON.parse(row.value) as string) : null;
  };
  const setSetting = (key: string, value: unknown) =>
    db
      .prepare(
        `INSERT INTO settings (user_id, key, value) VALUES (?, ?, ?)
         ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value`,
      )
      .run(DEMO_USER_ID, key, JSON.stringify(value));

  // Upsert: vorhandene Fundstelle aktualisieren, neue anlegen. `discovered` bleibt
  // erhalten (Erst-Entdeckung), alles andere wird auf den aktuellen Scan-Stand gebracht.
  const upsertFinding = db.prepare(
    `INSERT INTO findings
       (id,user_id,title,category,source,sensitivity,risk,exposed_data,discovered,last_seen,status,description,url,actions)
     VALUES
       (@id,@user_id,@title,@category,@source,@sensitivity,@risk,@exposed_data,@discovered,@last_seen,@status,@description,@url,@actions)
     ON CONFLICT(id) DO UPDATE SET
       title=excluded.title, source=excluded.source, sensitivity=excluded.sensitivity, risk=excluded.risk,
       exposed_data=excluded.exposed_data, last_seen=excluded.last_seen, status=excluded.status,
       description=excluded.description, url=excluded.url, actions=excluded.actions`,
  );

  const insertAlert = db.prepare(
    `INSERT INTO alerts (id,user_id,ts,module,title,detail,severity,related_id)
     VALUES (?,?,?,?,?,?,?,?)
     ON CONFLICT(id) DO NOTHING`,
  );

  const exists = db.prepare("SELECT 1 FROM findings WHERE id = ?");

  // ── Liste aller Leak-Fundstellen + Zeitpunkt des letzten Scans ──────────────────
  app.get("/api/leaks", () => {
    const items = db
      .prepare("SELECT * FROM findings WHERE user_id = ? AND category = 'leak' ORDER BY last_seen DESC")
      .all(DEMO_USER_ID)
      .map(toFinding);
    return { items, lastScan: getSetting("leakLastScan") };
  });

  // ── Scan auslösen (HIBP oder Mock) ──────────────────────────────────────────────
  // Ohne `email` werden ALLE E-Mails der Identität (Profil) geprüft.
  app.post("/api/leaks/scan", async (req) => {
    const body = LeakScanRequest.parse(req.body ?? {});
    const emails = body.email ? [body.email] : loadIdentity(db).emails;
    if (emails.length === 0) throw new ApiErr(400, "no_email", "Keine E-Mail zum Scannen vorhanden — bitte im Profil hinterlegen.");

    // Treffer über alle E-Mails einsammeln und nach Finding-ID deduplizieren.
    const byId = new Map<string, IdentityFinding>();
    let mock = false;
    for (const email of emails) {
      const scan = await scanBreaches(db, email);
      mock = mock || scan.mock;
      for (const f of scan.findings) byId.set(f.id, f);
    }
    const findings = [...byId.values()];
    const nowIso = new Date().toISOString();
    let created = 0;

    const tx = db.transaction((findings: IdentityFinding[]) => {
      for (const f of findings) {
        const isNew = !exists.get(f.id);
        upsertFinding.run({
          id: f.id,
          user_id: DEMO_USER_ID,
          title: f.title,
          category: f.category,
          source: f.source,
          sensitivity: f.sensitivity,
          risk: f.risk,
          exposed_data: JSON.stringify(f.exposedData),
          discovered: f.discovered,
          last_seen: f.lastSeen,
          status: f.status,
          description: f.description,
          url: f.url ?? null,
          actions: JSON.stringify(f.actions),
        });
        if (isNew) {
          created++;
          // Neue kritische/hohe Leaks als Dashboard-Ereignis sichtbar machen.
          if (f.risk === "critical" || f.risk === "high") {
            insertAlert.run(
              `alert-leak-${f.id}`,
              DEMO_USER_ID,
              nowIso,
              "Identitäts-Inventar",
              `Neuer Daten-Leak: ${f.title.replace(/^Daten-Leak — /, "")}`,
              f.description.slice(0, 160),
              "danger",
              f.id,
            );
          }
        }
      }
    });
    tx(findings);

    setSetting("leakLastScan", nowIso);

    return {
      scanned: emails,
      total: findings.length,
      created,
      mock,
      findings,
    };
  });
}
