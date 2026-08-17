import type { IdentityFinding, RiskLevel, FindingCategory, FindingStatus } from "@icp/shared";

/**
 * Exposure-Score — deterministische Formel (0..100, höher = mehr Exposure).
 *
 *   findingScore = riskWeight × reachWeight × statusMultiplier × sensitivityFactor
 *   raw          = Σ findingScore
 *   score        = round( clamp( raw / REFERENCE × 100, 0, 100 ) )
 *
 * Faktoren:
 *   risk    → wie gravierend die Daten sind
 *   reach   → wie öffentlich die Kategorie typischerweise ist
 *   status  → aktive Fundstellen zählen voll, ruhende anteilig, entfernte gar nicht
 *   sensitivity (0..1) moduliert zwischen 0.5× und 1.0×
 *
 * Rein serverseitig; das Frontend liest nur das Ergebnis.
 */

const RISK_WEIGHT: Record<RiskLevel, number> = {
  low: 0.25,
  medium: 0.5,
  high: 0.8,
  critical: 1.0,
};

const REACH_WEIGHT: Record<FindingCategory, number> = {
  leak: 1.0,
  broker: 0.85,
  search: 0.6,
  account: 0.45,
};

const STATUS_MULTIPLIER: Record<FindingStatus, number> = {
  active: 1.0,
  dormant: 0.35,
  removed: 0.0,
};

// Referenzsumme für die Normalisierung auf 0..100 (kalibriert am Seed-Volumen).
const REFERENCE = 7.5;

export function findingScore(f: IdentityFinding): number {
  return (
    RISK_WEIGHT[f.risk] *
    REACH_WEIGHT[f.category] *
    STATUS_MULTIPLIER[f.status] *
    (0.5 + 0.5 * f.sensitivity)
  );
}

export function exposureScore(findings: IdentityFinding[]): number {
  const raw = findings.reduce((sum, f) => sum + findingScore(f), 0);
  return Math.round(Math.max(0, Math.min(100, (raw / REFERENCE) * 100)));
}

export function scoreBand(score: number): "stable" | "watch" | "elevated" {
  if (score >= 70) return "elevated";
  if (score >= 45) return "watch";
  return "stable";
}
