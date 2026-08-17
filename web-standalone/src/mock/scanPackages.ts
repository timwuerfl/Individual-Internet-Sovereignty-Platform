// Scan-Pakete für Datenleck-Überwachung — einmalige Zahlung, KEIN Abo.
// // TODO: backend — echte Zahlungsabwicklung + Scan-Scheduling.
export interface ScanPackage {
  id: string;
  name: string;
  cadence: string;
  scansPerYear: string;
  price: number; // EUR, einmalig für ein Jahr
  blurb: string;
  highlight?: boolean;
}

export const scanPackages: ScanPackage[] = [
  {
    id: "pkg-12",
    name: "Basis",
    cadence: "12 Scans / Jahr",
    scansPerYear: "≈ alle 4 Wochen",
    price: 5,
    blurb: "Regelmäßiger Grundschutz — gleichmäßig über das Jahr verteilt.",
  },
  {
    id: "pkg-weekly",
    name: "Wöchentlich",
    cadence: "Wöchentliche Scans / Jahr",
    scansPerYear: "52 Scans",
    price: 15,
    blurb: "Engmaschige Überwachung für schnellere Reaktion.",
    highlight: true,
  },
  {
    id: "pkg-daily",
    name: "Täglich",
    cadence: "Tägliche Scans / Jahr",
    scansPerYear: "365 Scans",
    price: 30,
    blurb: "Maximale Wachsamkeit — neue Lecks am selben Tag.",
  },
];
