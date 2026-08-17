import type { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import { AgentCreate, AgentUpdate, ScopeUpdate, type AgentDetail } from "@icp/shared";
import type { DB } from "../db.js";
import { DEMO_USER_ID } from "../db.js";
import { toAgent, toScope, toActivity } from "../lib/rows.js";
import { buildAgentDetail, detectAnomalies } from "../lib/agentLogic.js";
import { notFound } from "../lib/errors.js";

// Kuratiertes Deep-Link-Verzeichnis statt Auto-Aggregation (siehe Tier-Trennung).
// SEED-DATEN — die Auto-Erkennung neuer Grants ist bewusst NUR ein Mock-Hinweis.
const CONNECTED_APPS = [
  { id: "google", name: "Google-Konto", url: "https://myaccount.google.com/permissions", note: "Apps mit Kontozugriff verwalten" },
  { id: "microsoft", name: "Microsoft", url: "https://account.microsoft.com/privacy/app-access", note: "App-Berechtigungen prüfen" },
  { id: "github", name: "GitHub", url: "https://github.com/settings/applications", note: "Autorisierte OAuth-Apps" },
];

export function registerAgents(app: FastifyInstance, db: DB) {
  const detail = (id: string): AgentDetail | null => {
    const row = db.prepare("SELECT * FROM agents WHERE user_id = ? AND id = ?").get(DEMO_USER_ID, id);
    if (!row) return null;
    const scopes = db.prepare("SELECT * FROM agent_scopes WHERE agent_id = ?").all(id).map(toScope);
    const acts = db.prepare("SELECT * FROM agent_activities WHERE agent_id = ?").all(id).map(toActivity);
    return buildAgentDetail(toAgent(row), scopes, acts);
  };

  const allIds = () =>
    (db.prepare("SELECT id FROM agents WHERE user_id = ?").all(DEMO_USER_ID) as { id: string }[]).map((r) => r.id);

  // ── Connected-Apps-Verzeichnis (kuratiert, KEINE Auto-Aggregation) ──────────────
  app.get("/api/agents/connected-apps", () => ({
    apps: CONNECTED_APPS,
    autoDetect: false, // // TODO: echte Integration — OAuth-Ingest neuer Grants
  }));

  // ── Aktivitäts-Digest über alle Agenten ────────────────────────────────────────
  app.get<{ Querystring: { days?: string } }>("/api/agents/digest", (req) => {
    const days = Math.max(1, Math.min(90, Number(req.query.days ?? 7)));
    const since = Date.now() - days * 86_400_000;
    let total = 0;
    let flagged = 0;
    const perAgent = allIds().map((id) => {
      const agentRow = db.prepare("SELECT * FROM agents WHERE id = ?").get(id);
      const acts = db.prepare("SELECT * FROM agent_activities WHERE agent_id = ?").all(id).map(toActivity);
      const windowActs = acts.filter((a) => new Date(a.ts).getTime() >= since);
      total += windowActs.length;
      flagged += windowActs.filter((a) => a.status === "flagged").length;
      const { count, reasons } = detectAnomalies(acts);
      return { id, name: toAgent(agentRow).name, actions: windowActs.length, anomalies: count, reasons };
    });
    return { windowDays: days, totalActions: total, flaggedActions: flagged, agents: perAgent };
  });

  // ── Registry ────────────────────────────────────────────────────────────────────
  app.get("/api/agents", () => allIds().map((id) => detail(id)!));

  app.get<{ Params: { id: string } }>("/api/agents/:id", (req) => {
    const d = detail(req.params.id);
    if (!d) throw notFound("Agent");
    return d;
  });

  app.post("/api/agents", (req, reply) => {
    const body = AgentCreate.parse(req.body);
    const id = `ag-${randomUUID().slice(0, 8)}`;
    db.prepare(
      "INSERT INTO agents (id,user_id,name,vendor,purpose,status,last_active) VALUES (?,?,?,?,?,?,?)",
    ).run(id, DEMO_USER_ID, body.name, body.vendor, body.purpose, "active", new Date().toISOString());
    const sc = db.prepare(
      "INSERT INTO agent_scopes (id,agent_id,layer,label,granted,last_used) VALUES (?,?,?,?,?,?)",
    );
    body.scopes.forEach((s, i) => sc.run(`${id}-sc${i}`, id, s.layer, s.label, s.granted ? 1 : 0, null));
    reply.code(201);
    return detail(id)!;
  });

  app.patch<{ Params: { id: string } }>("/api/agents/:id", (req) => {
    const row = db.prepare("SELECT * FROM agents WHERE user_id = ? AND id = ?").get(DEMO_USER_ID, req.params.id);
    if (!row) throw notFound("Agent");
    const merged = { ...toAgent(row), ...AgentUpdate.parse(req.body) };
    db.prepare("UPDATE agents SET name=?,vendor=?,purpose=?,status=?,last_active=? WHERE id=? AND user_id=?").run(
      merged.name, merged.vendor, merged.purpose, merged.status, merged.lastActive, req.params.id, DEMO_USER_ID,
    );
    return detail(req.params.id)!;
  });

  app.delete<{ Params: { id: string } }>("/api/agents/:id", (req) => {
    const res = db.prepare("DELETE FROM agents WHERE user_id = ? AND id = ?").run(DEMO_USER_ID, req.params.id);
    if (res.changes === 0) throw notFound("Agent");
    return { ok: true };
  });

  // Einzelnes Recht (Scope) an-/abschalten.
  app.patch<{ Params: { id: string; scopeId: string } }>("/api/agents/:id/scopes/:scopeId", (req) => {
    const { granted } = ScopeUpdate.parse(req.body);
    const res = db
      .prepare("UPDATE agent_scopes SET granted = ? WHERE id = ? AND agent_id = ?")
      .run(granted ? 1 : 0, req.params.scopeId, req.params.id);
    if (res.changes === 0) throw notFound("Scope");
    return detail(req.params.id)!;
  });
}
