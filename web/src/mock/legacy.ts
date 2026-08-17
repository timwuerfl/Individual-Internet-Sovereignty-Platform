import type { LegacyAsset, Beneficiary, MemorialItem } from "@/lib/types";

export const beneficiaries: Beneficiary[] = [
  { id: "ben-1", name: "Jonas Kessler", relation: "Bruder", email: "jonas.k@example.de" },
  { id: "ben-2", name: "Marlene Vogt", relation: "Partnerin", email: "m.vogt@example.de" },
  { id: "ben-3", name: "Dr. Anke Reimann", relation: "Notarin", email: "kanzlei@reimann-notar.de" },
];

// Inventar digitaler Assets mit posthumen Anweisungen.
// // TODO: backend — sichere Hinterlegung & rechtsgültige Vollstreckung.
export const legacyAssets: LegacyAsset[] = [
  {
    id: "leg-google",
    account: "Google-Konto",
    type: "email",
    value: "E-Mail, Fotos (12 Jahre), Dokumente",
    directive: "transfer",
    beneficiaryId: "ben-2",
    notes: "Familienfotos an Marlene übergeben, danach Konto schließen.",
  },
  {
    id: "leg-instagram",
    account: "Instagram",
    type: "social",
    value: "Privates Profil, ~400 Beiträge",
    directive: "memorialize",
    beneficiaryId: "ben-1",
    notes: "In Gedenkzustand versetzen, keine neuen Logins.",
  },
  {
    id: "leg-bank",
    account: "DKB Girokonto",
    type: "financial",
    value: "Girokonto, Daueraufträge",
    directive: "transfer",
    beneficiaryId: "ben-3",
    notes: "Abwicklung über Notariat Reimann. Vollmacht hinterlegt.",
  },
  {
    id: "leg-crypto",
    account: "Ledger Wallet",
    type: "crypto",
    value: "Kryptowerte (Seed-Phrase offline)",
    directive: "transfer",
    beneficiaryId: "ben-1",
    notes: "Seed-Phrase im Bankschließfach. Zugang nur über Notariat.",
  },
  {
    id: "leg-linkedin",
    account: "LinkedIn",
    type: "social",
    value: "Berufliches Profil",
    directive: "delete",
    beneficiaryId: null,
    notes: "Vollständig löschen.",
  },
  {
    id: "leg-spotify",
    account: "Spotify Premium",
    type: "subscription",
    value: "Abo, Playlists",
    directive: "delete",
    beneficiaryId: null,
    notes: "Abo kündigen, Playlists vorher exportieren.",
  },
  {
    id: "leg-dropbox",
    account: "Dropbox",
    type: "cloud",
    value: "Archiv, Projektdateien",
    directive: "undecided",
    beneficiaryId: null,
    notes: "",
  },
];

// Digitaler Friedhof — Seed-Inhalte für die Gedenkseite.
// // TODO: backend — sichere Hinterlegung, posthume Freigabe, Hosting der Gedenkseite.
export const memorialSeed: MemorialItem[] = [
  {
    id: "mem-1",
    title: "Abschiedsbrief an meine Familie",
    kind: "letter",
    visibility: "family",
    fileName: "abschiedsbrief.pdf",
    message: "Wird erst nach Bestätigung des Nachlassfalls für die Familie sichtbar.",
  },
  {
    id: "mem-2",
    title: "Lieblingsfotos — Reisen 2015–2024",
    kind: "photo",
    visibility: "public",
    fileName: "reise-album.zip",
    message: "Eine öffentliche Galerie als Erinnerung.",
  },
  {
    id: "mem-3",
    title: "Sprachnachricht an Marlene",
    kind: "voice",
    visibility: "code",
    fileName: "nachricht-marlene.m4a",
    message: "Zugang nur mit persönlichem Code, der im Schließfach liegt.",
  },
];
