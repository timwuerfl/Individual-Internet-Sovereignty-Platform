import type { Agent, AgentScope, AgentActivity, AgentDetail } from "@icp/shared";
import { LAYER_LABELS } from "@icp/shared";

/**
 * Agenten-Logik (downgescopt) — alles serverseitig, deterministisch.
 *
 *  • Exposure: layer-gewichtete Summe der GEWÄHRTEN Rechte → 0..100.
 *  • Hygiene:  ein gewährtes Recht, das > 6 Monate ungenutzt ist, wird geflaggt.
 *  • Anomalien: echte Heuristiken über das Aktivitäts-Log (geflaggte Aktionen +
 *    ungewöhnliche Frequenz im 24h-Fenster).
 */

const SIX_MONTHS_MS = 182 * 24 * 60 * 60 * 1000;
const FREQUENCY_THRESHOLD_24H = 8; // mehr Aktionen/Tag gelten als auffällig

// Höhere Layer = mehr Risiko (Weitergabe/Training am höchsten).
const LAYER_WEIGHT: Record<number, number> = {
  0: 0.2, // Identität
  1: 0.5, // Wissen / Daten
  2: 0.8, // Handlung
  3: 1.0, // Weitergabe / Training
  4: 0.6, // Beobachtung
};
const MAX_WEIGHT = Object.values(LAYER_WEIGHT).reduce((a, b) => a + b, 0);

export function agentExposure(scopes: AgentScope[]): number {
  const sum = scopes
    .filter((s) => s.granted)
    .reduce((acc, s) => acc + (LAYER_WEIGHT[s.layer] ?? 0), 0);
  return Math.round((sum / MAX_WEIGHT) * 100);
}

export function hygieneFlags(
  agent: Agent,
  scopes: AgentScope[],
  now: Date = new Date(),
): string[] {
  const flags: string[] = [];
  for (const s of scopes) {
    if (!s.granted || !s.lastUsed) continue;
    if (now.getTime() - new Date(s.lastUsed).getTime() > SIX_MONTHS_MS) {
      flags.push(`Recht „${s.label}" (${LAYER_LABELS[s.layer]}) seit über 6 Monaten ungenutzt`);
    }
  }
  if (now.getTime() - new Date(agent.lastActive).getTime() > SIX_MONTHS_MS) {
    flags.push("Agent seit über 6 Monaten inaktiv — Zugriff überprüfen");
  }
  return flags;
}

export function detectAnomalies(
  activities: AgentActivity[],
  now: Date = new Date(),
): { count: number; reasons: string[] } {
  const reasons: string[] = [];

  const flagged = activities.filter((a) => a.status === "flagged");
  for (const a of flagged) {
    reasons.push(a.action);
  }

  // Frequenz-Heuristik im 24h-Fenster.
  const since = now.getTime() - 24 * 60 * 60 * 1000;
  const recent = activities.filter((a) => new Date(a.ts).getTime() >= since);
  if (recent.length > FREQUENCY_THRESHOLD_24H) {
    reasons.push(`Ungewöhnlich hohe Aktivität: ${recent.length} Aktionen in 24h`);
  }

  return { count: reasons.length, reasons };
}

export function agentTrust(exposure: number, anomalies: number): number {
  return Math.max(0, Math.min(100, Math.round(100 - exposure * 0.5 - anomalies * 20)));
}

export function buildAgentDetail(
  agent: Agent,
  scopes: AgentScope[],
  activities: AgentActivity[],
  now: Date = new Date(),
): AgentDetail {
  const exposure = agentExposure(scopes);
  const { count: anomalies } = detectAnomalies(activities, now);
  const trust = agentTrust(exposure, anomalies);
  const flags = hygieneFlags(agent, scopes, now);
  // Anomalien überschreiben den gespeicherten Status.
  const status = anomalies > 0 ? "anomaly" : agent.status;
  return {
    ...agent,
    status,
    scopes,
    exposure,
    trust,
    hygieneFlags: flags,
    anomalies,
    log: [...activities].sort((a, b) => b.ts.localeCompare(a.ts)),
  };
}
