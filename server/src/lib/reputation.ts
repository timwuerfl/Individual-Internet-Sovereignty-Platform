import type { Perspective, ReputationSignal, PerspectiveView } from "@icp/shared";

// Editorial-Rahmen pro Perspektive. Die Signale kommen aus der DB; Tonalität und
// Empfehlungen werden serverseitig daraus ABGELEITET.
const LABEL: Record<Perspective, string> = {
  recruiter: "Recruiter",
  insurer: "Versicherer",
  public: "Öffentlichkeit",
};

const SUMMARY: Record<Perspective, string> = {
  recruiter:
    "Ein:e Recruiter:in sieht ein kohärentes, kompetentes Berufsbild. Werdegang und öffentliche Beiträge stützen einander; kaum Reibungspunkte.",
  insurer:
    "Aus Sicht eines datengetriebenen Versicherers entsteht ein erstaunlich detailliertes Bild — vor allem aus Broker-Profilen und Standortdaten, nicht aus dem, was du bewusst teilst.",
  public:
    "Für eine breite, anonyme Öffentlichkeit ist das größte Problem nicht, was du zeigst — sondern was zusammengeführt werden kann. Leak-Daten plus Personensuchen ermöglichen Re-Identifizierung.",
};

// Ableitung: jedes negative Signal erzeugt eine konkrete Empfehlung.
function recommendationFor(signal: ReputationSignal): string {
  return `${signal.label}: ${signal.note}`;
}

function deriveTone(signals: ReputationSignal[]): PerspectiveView["tone"] {
  const pos = signals.filter((s) => s.impact === "positive").length;
  const neg = signals.filter((s) => s.impact === "negative").length;
  if (neg === 0 && pos > 0) return "positive";
  if (neg > pos) return "risk";
  if (neg > 0) return "mixed";
  return "neutral";
}

export function buildPerspectiveView(
  perspective: Perspective,
  signals: ReputationSignal[],
): PerspectiveView {
  const relevant = signals.filter((s) => s.perspective === perspective);
  return {
    perspective,
    label: LABEL[perspective],
    tone: deriveTone(relevant),
    summary: SUMMARY[perspective],
    signals: relevant,
    recommendations: relevant
      .filter((s) => s.impact === "negative")
      .map(recommendationFor),
  };
}

export const PERSPECTIVES: Perspective[] = ["recruiter", "insurer", "public"];
