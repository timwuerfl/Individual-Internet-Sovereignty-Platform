import type { FastifyInstance } from "fastify";
import { Perspective } from "@icp/shared";
import type { DB } from "../db.js";
import { DEMO_USER_ID } from "../db.js";
import { toSignal } from "../lib/rows.js";
import { buildPerspectiveView, PERSPECTIVES } from "../lib/reputation.js";

export function registerReputation(app: FastifyInstance, db: DB) {
  // Alle Perspektiven (serverseitig aus Signalen aggregiert).
  app.get("/api/reputation", () => {
    const signals = db
      .prepare("SELECT * FROM reputation_signals WHERE user_id = ?")
      .all(DEMO_USER_ID)
      .map(toSignal);
    return PERSPECTIVES.map((p) => buildPerspectiveView(p, signals));
  });

  // Einzelne Perspektive.
  app.get<{ Params: { perspective: string } }>("/api/reputation/:perspective", (req) => {
    const perspective = Perspective.parse(req.params.perspective);
    const signals = db
      .prepare("SELECT * FROM reputation_signals WHERE user_id = ? AND perspective = ?")
      .all(DEMO_USER_ID, perspective)
      .map(toSignal);
    return buildPerspectiveView(perspective, signals);
  });
}
