import type { DataRightsCase } from "@/lib/types";

// DSGVO-Fälle — UI-only. // TODO: backend — Versand, Fristen, Behörden-Eskalation.
export const dataRightsCases: DataRightsCase[] = [
  {
    id: "dr-acxiom",
    controller: "Acxiom Deutschland GmbH",
    legalBasisChallenged: "Berechtigtes Interesse (Art. 6 (1) f) — Direktmarketing-Profiling",
    currentStage: "objection",
    deadline: "2026-07-10",
    stages: [
      {
        stage: "access",
        state: "done",
        date: "2026-05-29",
        note: "Auskunftsersuchen nach Art. 15 versendet, Eingang bestätigt.",
      },
      {
        stage: "objection",
        state: "active",
        date: "2026-06-10",
        note: "Widerspruch gegen Profiling nach Art. 21 eingelegt. Antwort ausstehend.",
      },
      { stage: "erasure", state: "pending", note: "Löschung nach Art. 17 vorbereitet." },
      { stage: "complaint", state: "pending", note: "Beschwerde bei Aufsichtsbehörde als Option." },
    ],
  },
  {
    id: "dr-spokeo",
    controller: "Spokeo, Inc.",
    legalBasisChallenged: "Keine gültige Rechtsgrundlage für Veröffentlichung (Art. 6)",
    currentStage: "erasure",
    deadline: "2026-06-25",
    stages: [
      {
        stage: "access",
        state: "done",
        date: "2026-05-02",
        note: "Auskunft erteilt: Quellen offengelegt.",
      },
      {
        stage: "objection",
        state: "done",
        date: "2026-05-18",
        note: "Widerspruch akzeptiert.",
      },
      {
        stage: "erasure",
        state: "active",
        date: "2026-06-12",
        note: "Löschersuchen nach Art. 17 läuft. Teil-Entfernung bestätigt.",
      },
      { stage: "complaint", state: "pending", note: "Nur bei Nicht-Erfüllung." },
    ],
  },
  {
    id: "dr-yasni",
    controller: "Yasni GmbH",
    legalBasisChallenged: "Recht auf Vergessenwerden — veraltete Treffer",
    currentStage: "access",
    stages: [
      {
        stage: "access",
        state: "active",
        date: "2026-06-14",
        note: "Auskunftsersuchen versendet. Eingangsbestätigung ausstehend.",
      },
      { stage: "objection", state: "pending", note: "" },
      { stage: "erasure", state: "pending", note: "" },
      { stage: "complaint", state: "pending", note: "" },
    ],
  },
  {
    id: "dr-databroker-x",
    controller: "LiveRamp (Datenhandel)",
    legalBasisChallenged: "Weitergabe an Dritte ohne Einwilligung",
    currentStage: "complaint",
    deadline: "2026-06-20",
    stages: [
      { stage: "access", state: "done", date: "2026-03-01", note: "Auskunft unvollständig erteilt." },
      { stage: "objection", state: "done", date: "2026-03-20", note: "Widerspruch ignoriert." },
      { stage: "erasure", state: "done", date: "2026-04-15", note: "Löschung verweigert." },
      {
        stage: "complaint",
        state: "active",
        date: "2026-05-30",
        note: "Beschwerde beim Landesdatenschutzbeauftragten eingereicht. In Bearbeitung.",
      },
    ],
  },
];
