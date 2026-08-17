import type { FastifyInstance } from "fastify";
import { FindingQuery, type IdentityFinding, type RiskLevel } from "@icp/shared";
import type { DB } from "../db.js";
import { DEMO_USER_ID } from "../db.js";
import { toFinding } from "../lib/rows.js";
import { notFound } from "../lib/errors.js";

const RISK_ORDER: Record<RiskLevel, number> = { critical: 4, high: 3, medium: 2, low: 1 };

export function registerFindings(app: FastifyInstance, db: DB) {
  // Liste mit serverseitiger Suche / Filter / Sortierung / Pagination.
  app.get("/api/findings", (req) => {
    const query = FindingQuery.parse(req.query);
    const rows = db
      .prepare("SELECT * FROM findings WHERE user_id = ?")
      .all(DEMO_USER_ID)
      .map(toFinding);

    let items = rows;
    if (query.category) items = items.filter((f) => f.category === query.category);
    if (query.q) {
      const q = query.q.toLowerCase();
      items = items.filter(
        (f) =>
          f.title.toLowerCase().includes(q) ||
          f.source.toLowerCase().includes(q) ||
          f.exposedData.some((d) => d.toLowerCase().includes(q)),
      );
    }

    items.sort((a, b) => {
      if (query.sort === "title") return a.title.localeCompare(b.title);
      if (query.sort === "recent") return b.lastSeen.localeCompare(a.lastSeen);
      return RISK_ORDER[b.risk] - RISK_ORDER[a.risk];
    });

    const total = items.length;
    const start = (query.page - 1) * query.pageSize;
    const paged: IdentityFinding[] = items.slice(start, start + query.pageSize);
    return { items: paged, total, page: query.page, pageSize: query.pageSize };
  });

  app.get<{ Params: { id: string } }>("/api/findings/:id", (req) => {
    const row = db
      .prepare("SELECT * FROM findings WHERE user_id = ? AND id = ?")
      .get(DEMO_USER_ID, req.params.id);
    if (!row) throw notFound("Fundstelle");
    return toFinding(row);
  });
}
