import type { ActivityEvent } from "@/lib/types";

// Headline metrics for the overview. // TODO: backend — compute from live signals.
export const dashboard = {
  exposureScore: 58, // 0..100, higher = more exposure
  scoreTrend: +6, // change vs last month (positive = worse)
  // Sparkline of the last 8 months of the exposure score.
  scoreHistory: [41, 44, 43, 48, 47, 52, 52, 58],
  stats: {
    sourcesTracked: 13,
    openRisks: 4,
    activeLeaks: 3,
    rightsCasesOpen: 3,
  },
};

export const events: ActivityEvent[] = [
  {
    id: "ev-1",
    ts: "2026-06-17T08:42:00",
    module: "Deepfake-Monitoring",
    title: "Mutmaßliches Fake-Profil erkannt",
    detail: "Ein Instagram-Konto verwendet deinen Namen und dein Profilfoto.",
    severity: "danger",
  },
  {
    id: "ev-2",
    ts: "2026-06-09T19:05:00",
    module: "Identitäts-Inventar",
    title: "Neuer Daten-Leak gefunden",
    detail: "Deine E-Mail erscheint in „Collection #5“ inkl. altem Klartext-Passwort.",
    severity: "danger",
  },
  {
    id: "ev-3",
    ts: "2026-06-10T11:20:00",
    module: "Datenrechte",
    title: "Acxiom hat Auskunft bestätigt",
    detail: "Eingangsbestätigung erhalten. Frist für Vollauskunft läuft.",
    severity: "info",
  },
  {
    id: "ev-4",
    ts: "2026-06-05T14:00:00",
    module: "Identitäts-Inventar",
    title: "Spokeo-Eintrag aktualisiert",
    detail: "Telefonnummer und Verwandten-Verknüpfung neu sichtbar.",
    severity: "warn",
  },
  {
    id: "ev-5",
    ts: "2026-06-01T09:30:00",
    module: "Wahrnehmung",
    title: "Recruiter-Einschätzung verbessert",
    detail: "Aktualisiertes LinkedIn-Profil wirkt sich positiv aus.",
    severity: "ok",
  },
  {
    id: "ev-6",
    ts: "2026-05-28T16:45:00",
    module: "Datenrechte",
    title: "SCHUFA-Datenkopie eingegangen",
    detail: "Basisscore und gemeldete Vertragspartner einsehbar.",
    severity: "ok",
  },
];
