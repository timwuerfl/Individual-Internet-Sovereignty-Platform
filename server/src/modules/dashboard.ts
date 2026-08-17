import type { FastifyInstance } from "fastify";
import type { DB } from "../db.js";
import { DEMO_USER_ID } from "../db.js";
import { toFinding, toActivity, toAlert } from "../lib/rows.js";
import { exposureScore, scoreBand } from "../lib/score.js";
import { detectAnomalies } from "../lib/agentLogic.js";

export function registerDashboard(app: FastifyInstance, db: DB) {
  app.get("/api/dashboard", () => {
    const findings = db
      .prepare("SELECT * FROM findings WHERE user_id = ?")
      .all(DEMO_USER_ID)
      .map(toFinding);

    const score = exposureScore(findings);

    // Agenten-Anomalien echt aus den Aktivitäts-Logs ableiten.
    const agentIds = db
      .prepare("SELECT id FROM agents WHERE user_id = ?")
      .all(DEMO_USER_ID) as { id: string }[];
    let agentAnomalies = 0;
    for (const { id } of agentIds) {
      const acts = db
        .prepare("SELECT * FROM agent_activities WHERE agent_id = ?")
        .all(id)
        .map(toActivity);
      agentAnomalies += detectAnomalies(acts).count;
    }

    const events = db
      .prepare("SELECT * FROM alerts WHERE user_id = ? ORDER BY ts DESC")
      .all(DEMO_USER_ID)
      .map(toAlert);

    return {
      exposureScore: score,
      scoreBand: scoreBand(score),
      stats: {
        sourcesTracked: findings.length,
        openRisks: findings.filter((f) => f.status === "active" && (f.risk === "high" || f.risk === "critical")).length,
        activeLeaks: findings.filter((f) => f.category === "leak" && f.status === "active").length,
        agentAnomalies,
      },
      events,
    };
  });
}
