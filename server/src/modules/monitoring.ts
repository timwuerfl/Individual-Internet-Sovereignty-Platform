import type { FastifyInstance } from "fastify";
import { MonitoringScanRequest, DetectionUpdate, type Detection } from "@icp/shared";
import type { DB } from "../db.js";
import { DEMO_USER_ID } from "../db.js";
import { toDetection } from "../lib/rows.js";
import { notFound } from "../lib/errors.js";
import { scanMonitoring } from "../lib/imageSearch.js";
import { loadIdentity, isOwnUrl } from "../lib/identity.js";

export function registerMonitoring(app: FastifyInstance, db: DB) {
  // Treffer als isKnown markieren, wenn sie zu einem bekannten eigenen Konto gehören
  // (Abgleich per URL ODER Plattform+Handle aus dem Profil/Inventar).
  const markKnown = (items: Detection[]): Detection[] => {
    const snap = loadIdentity(db);
    return items.map((d) => ({ ...d, isKnown: isOwnUrl(snap, d.url) }));
  };

  const upsert = db.prepare(
    `INSERT INTO detections (id,user_id,ts,platform,title,url,thumbnail,match_type,confidence,status,source)
     VALUES (@id,@user_id,@ts,@platform,@title,@url,@thumbnail,@match_type,@confidence,@status,@source)
     ON CONFLICT(id) DO UPDATE SET
       ts=excluded.ts, platform=excluded.platform, title=excluded.title, url=excluded.url,
       thumbnail=excluded.thumbnail, confidence=excluded.confidence, source=excluded.source`,
  );
  const insertAlert = db.prepare(
    `INSERT INTO alerts (id,user_id,ts,module,title,detail,severity,related_id)
     VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING`,
  );
  const exists = db.prepare("SELECT 1 FROM detections WHERE id = ?");

  // ── Feed + Statusübersicht (eigene Konten als isKnown markiert) ───────────────
  app.get("/api/monitoring", () => {
    const items = markKnown(
      db
        .prepare("SELECT * FROM detections WHERE user_id = ? ORDER BY confidence DESC, ts DESC")
        .all(DEMO_USER_ID)
        .map(toDetection),
    );
    const summary = { total: items.length, new: 0, reviewed: 0, takedown_requested: 0, dismissed: 0, known: 0 };
    for (const d of items) {
      summary[d.status]++;
      if (d.isKnown) summary.known++;
    }
    return { items, summary };
  });

  // ── Scan auslösen (SerpAPI oder Mock) ────────────────────────────────────────
  app.post("/api/monitoring/scan", async (req) => {
    const body = MonitoringScanRequest.parse(req.body ?? {});
    // Ohne jegliche Angabe: Namens-/Handle-Scan aus dem Profil.
    const id = loadIdentity(db);
    const args =
      body.imageUrl || body.name || (body.terms && body.terms.length)
        ? body
        : { terms: [...new Set([...id.names, ...id.hostHandles.map((h) => h.handle)])] };

    const scan = await scanMonitoring(db, args);
    const detections = markKnown(scan.detections);
    const nowIso = new Date().toISOString();
    let created = 0;

    const tx = db.transaction((list: Detection[]) => {
      for (const d of list) {
        const isNew = !exists.get(d.id);
        upsert.run({
          id: d.id,
          user_id: DEMO_USER_ID,
          ts: d.ts,
          platform: d.platform,
          title: d.title,
          url: d.url,
          thumbnail: d.thumbnail,
          match_type: d.matchType,
          confidence: d.confidence,
          status: d.status,
          source: d.source,
        });
        if (isNew) {
          created++;
          // Dashboard-Ereignis nur für ECHTE (nicht-eigene), hochkonfidente Bild-Treffer.
          if (!d.isKnown && d.matchType === "image" && d.confidence >= 0.85) {
            insertAlert.run(
              `alert-det-${d.id}`,
              DEMO_USER_ID,
              nowIso,
              "Deepfake-Monitoring",
              "Mögliches Fake-Profil erkannt",
              `${d.title} (${d.platform}, Konfidenz ${Math.round(d.confidence * 100)} %).`,
              "danger",
              d.id,
            );
          }
        }
      }
    });
    tx(detections);

    return {
      mode: scan.mode,
      total: detections.length,
      created,
      mock: scan.mock,
      knownFiltered: detections.filter((d) => d.isKnown).length,
      detections,
    };
  });

  // ── Treffer bewerten (geprüft / Takedown / verworfen) ────────────────────────
  app.patch<{ Params: { id: string } }>("/api/monitoring/:id", (req) => {
    const { status } = DetectionUpdate.parse(req.body);
    const res = db
      .prepare("UPDATE detections SET status = ? WHERE id = ? AND user_id = ?")
      .run(status, req.params.id, DEMO_USER_ID);
    if (res.changes === 0) throw notFound("Treffer");
    const [d] = markKnown([toDetection(db.prepare("SELECT * FROM detections WHERE id = ?").get(req.params.id))]);
    return d;
  });
}
