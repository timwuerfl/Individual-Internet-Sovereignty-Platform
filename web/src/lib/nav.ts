import {
  LayoutDashboard,
  Boxes,
  Eye,
  Scroll,
  Settings,
  Scale,
  ScanFace,
  Bot,
  DatabaseZap,
  Fingerprint,
  type LucideIcon,
} from "lucide-react";
import type { ModuleMaturity } from "./types";

export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  maturity: ModuleMaturity;
  group: "core" | "protection" | "system";
  // Short caption used on the dashboard module grid.
  blurb: string;
}

// Single navigation registry — consumed by the Sidebar, the dashboard module
// grid, and the router. (A) = "live" (interactive mock), (B) = "preview" (UI only).
export const NAV: NavItem[] = [
  {
    path: "/",
    label: "Übersicht",
    icon: LayoutDashboard,
    maturity: "live",
    group: "core",
    blurb: "Risiko-Score, Ereignisse und Modul-Status auf einen Blick.",
  },
  {
    path: "/profile",
    label: "Meine Identität",
    icon: Fingerprint,
    maturity: "live",
    group: "core",
    blurb: "Eigene Namen, E-Mails und Konten pflegen — Basis für Leak- & Fake-Scan.",
  },
  {
    path: "/inventory",
    label: "Identitäts-Inventar",
    icon: Boxes,
    maturity: "live",
    group: "core",
    blurb: "Was über dich existiert — Accounts, Broker, Treffer, Leaks.",
  },
  {
    path: "/leaks",
    label: "Datenlecks",
    icon: DatabaseZap,
    maturity: "live",
    group: "core",
    blurb: "Wo deine Daten aufgetaucht sind — plus Scan-Pakete zur Überwachung.",
  },
  {
    path: "/reputation",
    label: "Wahrnehmung",
    icon: Eye,
    maturity: "live",
    group: "core",
    blurb: "Wie du auf Recruiter, Versicherer und Öffentlichkeit wirkst.",
  },
  {
    path: "/legacy",
    label: "Digitaler Nachlass",
    icon: Scroll,
    maturity: "live",
    group: "core",
    blurb: "Digitale Assets, Nachlassverwalter und posthume Anweisungen.",
  },
  {
    path: "/data-rights",
    label: "Datenrechte",
    icon: Scale,
    maturity: "preview",
    group: "protection",
    blurb: "DSGVO-Auskunft, Widerspruch, Löschung und Beschwerde.",
  },
  {
    path: "/monitoring",
    label: "Deepfake-Monitoring",
    icon: ScanFace,
    maturity: "preview",
    group: "protection",
    blurb: "Fake-Profile und mutmaßliche Deepfakes mit Takedown.",
  },
  {
    path: "/agents",
    label: "Agenten-Monitoring",
    icon: Bot,
    maturity: "preview",
    group: "protection",
    blurb: "Agenten, die in deinem Namen handeln — Scopes & Audit-Log.",
  },
  {
    path: "/settings",
    label: "Einstellungen",
    icon: Settings,
    maturity: "live",
    group: "system",
    blurb: "Verifizierter Identitäts-Kern und Datenhaltung.",
  },
];

export const GROUP_LABELS: Record<NavItem["group"], string> = {
  core: "Identität",
  protection: "Schutz",
  system: "System",
};
