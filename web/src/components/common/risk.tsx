import { Badge } from "@/components/ui";
import type { RiskLevel } from "@/lib/types";

export const RISK_LABEL: Record<RiskLevel, string> = {
  low: "Niedrig",
  medium: "Mittel",
  high: "Hoch",
  critical: "Kritisch",
};

const RISK_TONE = {
  low: "ok",
  medium: "warn",
  high: "danger",
  critical: "danger",
} as const;

// Consistent risk chip used across Inventory, Dashboard and detail views.
export function RiskTag({ level }: { level: RiskLevel }) {
  return <Badge tone={RISK_TONE[level]}>{RISK_LABEL[level]}</Badge>;
}

// Numeric weight for sorting "worst first".
export const RISK_WEIGHT: Record<RiskLevel, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};
