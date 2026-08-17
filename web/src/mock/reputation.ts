import type { PerspectiveView } from "@/lib/types";

// Aufbereitete Wahrnehmungs-Einschätzungen pro Perspektive.
// // TODO: backend — generieren aus aggregierten Signalen + Modell.
export const perspectives: PerspectiveView[] = [
  {
    perspective: "recruiter",
    label: "Recruiter",
    tone: "positive",
    summary:
      "Ein:e Recruiter:in sieht ein kohärentes, kompetentes Berufsbild. Werdegang und öffentliche Beiträge stützen einander; kaum Reibungspunkte.",
    signals: [
      {
        label: "LinkedIn vollständig & gepflegt",
        impact: "positive",
        note: "Lückenloser Werdegang, klare Rollenbeschreibung.",
      },
      {
        label: "Fachbeiträge auffindbar",
        impact: "positive",
        note: "Zwei zitierte Artikel stärken die Glaubwürdigkeit.",
      },
      {
        label: "Verwaistes XING-Profil",
        impact: "negative",
        note: "Veraltete Angaben können widersprüchlich wirken.",
      },
    ],
    recommendations: [
      "XING-Profil aktualisieren oder deaktivieren, um Widersprüche zu vermeiden.",
      "Ein bis zwei fachliche Beiträge prominenter verlinken.",
    ],
  },
  {
    perspective: "insurer",
    label: "Versicherer",
    tone: "mixed",
    summary:
      "Aus Sicht eines datengetriebenen Versicherers entsteht ein erstaunlich detailliertes Bild — vor allem aus Broker-Profilen und Standortdaten, nicht aus dem, was du bewusst teilst.",
    signals: [
      {
        label: "Acxiom-Konsumsegmente",
        impact: "negative",
        note: "Abgeleitete Risiko- und Kaufkraft-Merkmale ohne dein Zutun.",
      },
      {
        label: "Aktiver Standortverlauf",
        impact: "negative",
        note: "Mobilitätsmuster sind potenziell für Tarifierung relevant.",
      },
      {
        label: "Keine öffentlichen Gesundheitsdaten",
        impact: "positive",
        note: "Keine sensiblen medizinischen Spuren auffindbar.",
      },
    ],
    recommendations: [
      "Acxiom-Profil per DSGVO-Widerspruch eindämmen.",
      "Standortverlauf pausieren und Auto-Löschung aktivieren.",
    ],
  },
  {
    perspective: "public",
    label: "Öffentlichkeit",
    tone: "risk",
    summary:
      "Für eine breite, anonyme Öffentlichkeit ist das größte Problem nicht, was du zeigst — sondern was zusammengeführt werden kann. Leak-Daten plus Personensuchen ermöglichen Re-Identifizierung.",
    signals: [
      {
        label: "Klartext-Passwort im Leak",
        impact: "negative",
        note: "Kritisch, falls anderswo wiederverwendet.",
      },
      {
        label: "Spokeo: Telefon + Verwandte",
        impact: "negative",
        note: "Erleichtert gezieltes Social Engineering.",
      },
      {
        label: "Name häufig — gewisse Verdünnung",
        impact: "positive",
        note: "Mehrere Namensvettern erschweren eindeutige Zuordnung.",
      },
    ],
    recommendations: [
      "Sofort alle wiederverwendeten Passwörter ändern, 2FA aktivieren.",
      "Spokeo- und Yasni-Einträge löschen lassen.",
    ],
  },
];
