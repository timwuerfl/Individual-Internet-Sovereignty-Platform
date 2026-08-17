import type { MonitoredAgent } from "@/lib/types";

// Agenten-Registry — UI-only, Zukunftsmodul.
// // TODO: backend — OAuth-Scopes, signierte Audit-Logs, Anomalie-Erkennung, Kill-Switch.
export const agents: MonitoredAgent[] = [
  {
    id: "ag-shopping",
    name: "Beschaffungs-Assistent",
    vendor: "Mercato AI",
    purpose: "Vergleicht Preise und tätigt freigegebene Käufe bis 150 €.",
    status: "active",
    trust: 86,
    lastActive: "2026-06-17T07:55:00",
    anomalies: 0,
    scopes: [
      { label: "Zahlungen bis 150 € auslösen", granted: true },
      { label: "Lieferadresse lesen", granted: true },
      { label: "Bestellhistorie lesen", granted: true },
      { label: "Konto-Stammdaten ändern", granted: false },
    ],
    log: [
      { ts: "2026-06-17T07:55:00", action: "Preisvergleich für „Kaffeebohnen 1 kg“", status: "ok" },
      { ts: "2026-06-16T18:20:00", action: "Bestellung ausgelöst — 23,90 €", status: "ok" },
      { ts: "2026-06-14T10:05:00", action: "Warenkorb aktualisiert", status: "ok" },
    ],
  },
  {
    id: "ag-travel",
    name: "Reise-Planer",
    vendor: "Voyage Copilot",
    purpose: "Sucht und reserviert Reisen im Rahmen deiner Vorgaben.",
    status: "anomaly",
    trust: 41,
    lastActive: "2026-06-16T23:48:00",
    anomalies: 2,
    scopes: [
      { label: "Kalender lesen", granted: true },
      { label: "Reisen reservieren (ohne Zahlung)", granted: true },
      { label: "Zahlungen auslösen", granted: false },
      { label: "Kontakte lesen", granted: true },
    ],
    log: [
      {
        ts: "2026-06-16T23:48:00",
        action: "Zahlungsversuch 612 € außerhalb erlaubter Scopes",
        status: "flagged",
      },
      {
        ts: "2026-06-16T23:47:00",
        action: "Zugriff auf Kontakte um 23:47 (untypische Zeit)",
        status: "flagged",
      },
      { ts: "2026-06-15T09:12:00", action: "Hotelsuche Lissabon", status: "ok" },
    ],
  },
  {
    id: "ag-inbox",
    name: "Posteingangs-Sortierer",
    vendor: "Eigenbetrieb (lokal)",
    purpose: "Kategorisiert E-Mails und entwirft Antworten zur Freigabe.",
    status: "active",
    trust: 92,
    lastActive: "2026-06-17T08:30:00",
    anomalies: 0,
    scopes: [
      { label: "E-Mails lesen", granted: true },
      { label: "Labels setzen", granted: true },
      { label: "Entwürfe erstellen", granted: true },
      { label: "E-Mails senden", granted: false },
    ],
    log: [
      { ts: "2026-06-17T08:30:00", action: "14 E-Mails kategorisiert", status: "ok" },
      { ts: "2026-06-17T08:30:00", action: "2 Antwort-Entwürfe erstellt", status: "ok" },
    ],
  },
  {
    id: "ag-subscriptions",
    name: "Abo-Manager",
    vendor: "Mercato AI",
    purpose: "Überwacht Abos und kündigt ungenutzte nach Freigabe.",
    status: "paused",
    trust: 70,
    lastActive: "2026-06-02T12:00:00",
    anomalies: 0,
    scopes: [
      { label: "Abrechnungs-E-Mails lesen", granted: true },
      { label: "Kündigungen einreichen", granted: false },
    ],
    log: [
      { ts: "2026-06-02T12:00:00", action: "3 ungenutzte Abos erkannt", status: "ok" },
      { ts: "2026-06-02T12:00:00", action: "Vom Nutzer pausiert", status: "ok" },
    ],
  },
];
