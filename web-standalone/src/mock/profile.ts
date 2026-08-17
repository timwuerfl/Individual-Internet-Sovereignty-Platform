// Verifizierter Identitäts-Kern + Datenhaltung (Settings).
// // TODO: backend — eID/Verifizierung, verschlüsselte Datenhaltung, Schlüsselverwaltung.
export const profile = {
  name: "Lena Kessler",
  email: "lena.kessler@example.de",
  memberSince: "2024-03-01",
  verifications: [
    { id: "email", label: "E-Mail", status: "verified", detail: "lena.kessler@example.de" },
    { id: "phone", label: "Telefonnummer", status: "verified", detail: "+49 151 ••• ••72" },
    {
      id: "eid",
      label: "Personalausweis (eID)",
      status: "verified",
      detail: "Verifiziert am 04.03.2024",
    },
    {
      id: "address",
      label: "Wohnanschrift",
      status: "pending",
      detail: "Nachweis hochgeladen — in Prüfung",
    },
    {
      id: "biometric",
      label: "Biometrischer Referenz-Hash",
      status: "unverified",
      detail: "Für Deepfake-Abgleich — noch nicht hinterlegt",
    },
  ] as { id: string; label: string; status: "verified" | "pending" | "unverified"; detail: string }[],

  dataResidency: "Deutschland (Frankfurt)",
  dataSettings: [
    {
      id: "scan-frequency",
      label: "Automatische Überwachung",
      desc: "Wie oft das Netz nach neuen Fundstellen durchsucht wird.",
      type: "select" as const,
      value: "daily",
      options: [
        { value: "realtime", label: "Echtzeit" },
        { value: "daily", label: "Täglich" },
        { value: "weekly", label: "Wöchentlich" },
      ],
    },
  ],
  toggles: [
    {
      id: "local-first",
      label: "Local-First-Speicherung",
      desc: "Sensible Rohdaten bleiben verschlüsselt auf deinen Geräten; nur abgeleitete Signale werden synchronisiert.",
      value: true,
    },
    {
      id: "e2e",
      label: "Ende-zu-Ende-Verschlüsselung",
      desc: "Inventar und Nachlass-Anweisungen werden mit deinem Schlüssel verschlüsselt.",
      value: true,
    },
    {
      id: "ml-consent",
      label: "Modellgestützte Einschätzungen",
      desc: "Erlaubt aufbereitete Wahrnehmungs-Analysen aus deinen Signalen.",
      value: true,
    },
    {
      id: "broker-autoscan",
      label: "Data-Broker-Daueraufklärung",
      desc: "Regelmäßiger Abgleich gegen bekannte Datenhändler.",
      value: false,
    },
  ],
};
