import type { FastifyInstance } from "fastify";
import type { DB } from "../db.js";
import { seed } from "../seed.js";

export function registerDev(app: FastifyInstance, db: DB) {
  app.get("/api/health", () => ({ ok: true }));

  // Demo-Komfort: DB zurück auf Seed-Stand.
  app.post("/api/dev/reset", () => {
    seed(db);
    return { ok: true, reset: true };
  });
}
