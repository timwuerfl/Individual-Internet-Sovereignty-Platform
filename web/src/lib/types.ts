// Shared domain types for the prototype. All data is mocked (see /src/mock).

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type ModuleMaturity = "live" | "preview"; // (A) interactive vs (B) UI-only

// ── Identity Inventory ──────────────────────────────────────────────────────
export type InventoryCategory =
  | "account"
  | "broker"
  | "search"
  | "leak";

export interface InventoryItem {
  id: string;
  title: string; // e.g. "LinkedIn", "Acxiom Profil"
  category: InventoryCategory;
  source: string; // where we found it
  risk: RiskLevel;
  exposedData: string[]; // data points exposed
  discovered: string; // ISO date
  lastSeen: string; // ISO date
  status: "active" | "dormant" | "removed";
  description: string;
  url?: string;
  actions?: string[]; // suggested next steps
}

// ── Dashboard events ────────────────────────────────────────────────────────
export interface ActivityEvent {
  id: string;
  ts: string; // ISO datetime
  module: string;
  title: string;
  detail: string;
  severity: "info" | "ok" | "warn" | "danger";
}

// ── Reputation ──────────────────────────────────────────────────────────────
export type Perspective = "recruiter" | "insurer" | "public";

export interface PerspectiveView {
  perspective: Perspective;
  label: string;
  summary: string;
  tone: "positive" | "neutral" | "mixed" | "risk";
  signals: { label: string; impact: "positive" | "neutral" | "negative"; note: string }[];
  recommendations: string[];
}

// ── Digital Legacy ──────────────────────────────────────────────────────────
export type LegacyDirective = "memorialize" | "transfer" | "delete" | "undecided";

export interface LegacyAsset {
  id: string;
  account: string;
  type: "social" | "financial" | "email" | "cloud" | "subscription" | "crypto";
  value: string; // human description of what's there
  directive: LegacyDirective;
  beneficiaryId: string | null;
  notes: string;
}

export interface Beneficiary {
  id: string;
  name: string;
  relation: string;
  email: string;
}

// Digitaler Friedhof — Inhalte, die posthum auf einer Gedenk-Plattform zugänglich sein sollen.
export type MemorialKind = "photo" | "letter" | "video" | "voice" | "document";
export type MemorialVisibility = "public" | "family" | "code";

export interface MemorialItem {
  id: string;
  title: string;
  kind: MemorialKind;
  visibility: MemorialVisibility;
  fileName: string; // simulierter Datei-Anhang
  message: string;
}

// ── Data Rights (GDPR) — UI only ──────────────────────────────────────────────
export type CaseStage = "access" | "objection" | "erasure" | "complaint";
export type CaseStageState = "done" | "active" | "pending";

export interface DataRightsCase {
  id: string;
  controller: string;
  legalBasisChallenged: string;
  currentStage: CaseStage;
  stages: { stage: CaseStage; state: CaseStageState; date?: string; note: string }[];
  deadline?: string;
}

// ── Deepfake & Fake-Account Monitoring — UI only ──────────────────────────────
export interface DetectionHit {
  id: string;
  kind: "fake-profile" | "deepfake-image" | "deepfake-video" | "voice-clone";
  platform: string;
  handle: string;
  confidence: number; // 0..1
  detected: string; // ISO datetime
  status: "new" | "reviewing" | "takedown-requested" | "resolved";
  reference: string; // what it impersonates
  note: string;
}

// ── Agent Monitoring — UI only (future module) ────────────────────────────────
export interface AgentScope {
  label: string;
  granted: boolean;
}

export interface AgentAction {
  ts: string;
  action: string;
  status: "ok" | "flagged";
}

export interface MonitoredAgent {
  id: string;
  name: string;
  vendor: string;
  purpose: string;
  status: "active" | "paused" | "anomaly";
  trust: number; // 0..100
  scopes: AgentScope[];
  lastActive: string;
  anomalies: number;
  log: AgentAction[];
}
