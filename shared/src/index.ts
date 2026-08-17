/**
 * ────────────────────────────────────────────────────────────────────────────
 *  @icp/shared — Single source of truth for FE ↔ BE contracts.
 *  zod schemas → inferred TypeScript types. Imported by both /server and /web.
 * ────────────────────────────────────────────────────────────────────────────
 */
import { z } from "zod";

// ── Primitives ───────────────────────────────────────────────────────────────
export const RiskLevel = z.enum(["low", "medium", "high", "critical"]);
export type RiskLevel = z.infer<typeof RiskLevel>;

export const FindingCategory = z.enum(["account", "broker", "search", "leak"]);
export type FindingCategory = z.infer<typeof FindingCategory>;

export const FindingStatus = z.enum(["active", "dormant", "removed"]);
export type FindingStatus = z.infer<typeof FindingStatus>;

// ── User ───────────────────────────────────────────────────────────────────
export const User = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  memberSince: z.string(),
  dataResidency: z.string(),
});
export type User = z.infer<typeof User>;

// ── IdentityFinding ──────────────────────────────────────────────────────────
export const IdentityFinding = z.object({
  id: z.string(),
  title: z.string(),
  category: FindingCategory,
  source: z.string(),
  // 0..1 abgeleitete Sensitivität der exponierten Daten (fließt in den Score).
  sensitivity: z.number().min(0).max(1),
  risk: RiskLevel,
  exposedData: z.array(z.string()),
  discovered: z.string(), // ISO date
  lastSeen: z.string(), // ISO date
  status: FindingStatus,
  description: z.string(),
  url: z.string().optional(),
  actions: z.array(z.string()),
});
export type IdentityFinding = z.infer<typeof IdentityFinding>;

// Query params for server-side search/filter/sort/pagination.
export const FindingQuery = z.object({
  q: z.string().optional(),
  category: FindingCategory.optional(),
  sort: z.enum(["risk", "recent", "title"]).default("risk"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});
export type FindingQuery = z.infer<typeof FindingQuery>;

export const FindingPage = z.object({
  items: z.array(IdentityFinding),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});
export type FindingPage = z.infer<typeof FindingPage>;

// ── Eigene Identität / Konten (Profil) ─────────────────────────────────────────
export const OwnedAccount = z.object({
  id: z.string(),
  label: z.string(), // Dienst, z. B. "Instagram"
  handle: z.string().nullable(), // Benutzername/Handle
  url: z.string().nullable(), // Profil-URL
  email: z.string().nullable(), // zugehörige E-Mail (für Leak-Scan)
});
export type OwnedAccount = z.infer<typeof OwnedAccount>;

export const OwnedAccountCreate = z.object({
  label: z.string().min(1),
  handle: z.string().optional(),
  url: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
});
export const OwnedAccountUpdate = OwnedAccountCreate.partial();

export const IdentityProfile = z.object({
  name: z.string(),
  aliases: z.array(z.string()), // alternative Namensschreibweisen
  extraEmails: z.array(z.string()), // frei gepflegte E-Mails (editierbar)
  emails: z.array(z.string()), // berechnete Vereinigung — Basis für Leak-Scan
  accounts: z.array(OwnedAccount),
});
export type IdentityProfile = z.infer<typeof IdentityProfile>;

export const ProfileUpdate = z.object({
  name: z.string().min(1).optional(),
  aliases: z.array(z.string()).optional(),
  extraEmails: z.array(z.string()).optional(),
});

// ── Leak-Scan (Feature A — HaveIBeenPwned) ─────────────────────────────────────
export const LeakScanRequest = z.object({
  // Ohne Angabe werden ALLE E-Mails der Identität (Profil) gescannt.
  email: z.string().email().optional(),
});
export type LeakScanRequest = z.infer<typeof LeakScanRequest>;

export const LeakScanResult = z.object({
  scanned: z.array(z.string()), // gescannte E-Mails
  total: z.number(),
  created: z.number(),
  mock: z.boolean(), // true = ohne API-Key, Demo-Daten
  findings: z.array(IdentityFinding),
});
export type LeakScanResult = z.infer<typeof LeakScanResult>;

// ── Reputation ──────────────────────────────────────────────────────────────
export const Perspective = z.enum(["recruiter", "insurer", "public"]);
export type Perspective = z.infer<typeof Perspective>;

export const Impact = z.enum(["positive", "neutral", "negative"]);
export type Impact = z.infer<typeof Impact>;

export const ReputationSignal = z.object({
  id: z.string(),
  perspective: Perspective,
  label: z.string(),
  impact: Impact,
  note: z.string(),
});
export type ReputationSignal = z.infer<typeof ReputationSignal>;

// Server-derived, aggregated view per perspective.
export const PerspectiveView = z.object({
  perspective: Perspective,
  label: z.string(),
  tone: z.enum(["positive", "neutral", "mixed", "risk"]),
  summary: z.string(),
  signals: z.array(ReputationSignal),
  recommendations: z.array(z.string()),
});
export type PerspectiveView = z.infer<typeof PerspectiveView>;

// ── Monitoring (Feature B — SerpAPI Bild-/Account-Suche) ───────────────────────
export const DetectionStatus = z.enum(["new", "reviewed", "takedown_requested", "dismissed"]);
export type DetectionStatus = z.infer<typeof DetectionStatus>;

export const DetectionMatchType = z.enum(["image", "name"]);
export type DetectionMatchType = z.infer<typeof DetectionMatchType>;

export const Detection = z.object({
  id: z.string(),
  ts: z.string(), // ISO — wann gefunden
  platform: z.string(), // z. B. "instagram.com"
  title: z.string(),
  url: z.string(),
  thumbnail: z.string().nullable(),
  matchType: DetectionMatchType,
  confidence: z.number().min(0).max(1),
  status: DetectionStatus,
  source: z.string(), // z. B. "SerpAPI · Google Lens"
  // true = Treffer entspricht einem bekannten eigenen Konto (aus dem Inventar) →
  // wird nicht als Fake gewertet, sondern aus der Trefferliste herausgerechnet.
  isKnown: z.boolean(),
});
export type Detection = z.infer<typeof Detection>;

export const MonitoringScanRequest = z.object({
  imageUrl: z.string().url().optional(), // Referenzbild für Reverse-Image-Suche
  name: z.string().optional(), // einzelner Name/Begriff für die Text-Suche
  terms: z.array(z.string()).optional(), // mehrere Begriffe (Name + Aliasse + Handles)
});
export type MonitoringScanRequest = z.infer<typeof MonitoringScanRequest>;

export const MonitoringScanResult = z.object({
  mode: z.enum(["image", "name", "both"]),
  total: z.number(),
  created: z.number(),
  mock: z.boolean(),
  knownFiltered: z.number(), // wie viele Treffer als eigene Konten herausgerechnet wurden
  detections: z.array(Detection),
});
export type MonitoringScanResult = z.infer<typeof MonitoringScanResult>;

export const DetectionUpdate = z.object({ status: DetectionStatus });
export type DetectionUpdate = z.infer<typeof DetectionUpdate>;

// ── Digital Legacy ────────────────────────────────────────────────────────────
export const LegacyDirective = z.enum(["memorialize", "transfer", "delete", "undecided"]);
export type LegacyDirective = z.infer<typeof LegacyDirective>;

export const LegacyAssetType = z.enum([
  "social",
  "financial",
  "email",
  "cloud",
  "subscription",
  "crypto",
]);
export type LegacyAssetType = z.infer<typeof LegacyAssetType>;

export const Beneficiary = z.object({
  id: z.string(),
  name: z.string(),
  relation: z.string(),
  email: z.string().email(),
});
export type Beneficiary = z.infer<typeof Beneficiary>;
export const BeneficiaryCreate = Beneficiary.omit({ id: true });
export const BeneficiaryUpdate = BeneficiaryCreate.partial();

// LegacyAsset carries its instruction (directive + beneficiary + notes) inline.
export const LegacyAsset = z.object({
  id: z.string(),
  account: z.string(),
  type: LegacyAssetType,
  value: z.string(),
  directive: LegacyDirective,
  beneficiaryId: z.string().nullable(),
  notes: z.string(),
});
export type LegacyAsset = z.infer<typeof LegacyAsset>;
export const LegacyAssetCreate = LegacyAsset.omit({ id: true });
export const LegacyAssetUpdate = LegacyAssetCreate.partial();

// ── Agents (layered-rights model) ─────────────────────────────────────────────
export const AgentStatus = z.enum(["active", "paused", "anomaly"]);
export type AgentStatus = z.infer<typeof AgentStatus>;

// Layer 0 Identität · 1 Wissen/Daten · 2 Handlung · 3 Weitergabe/Training · 4 Beobachtung
export const AgentLayer = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
]);
export type AgentLayer = z.infer<typeof AgentLayer>;

export const LAYER_LABELS: Record<number, string> = {
  0: "Identität",
  1: "Wissen / Daten",
  2: "Handlung",
  3: "Weitergabe / Training",
  4: "Beobachtung",
};

export const AgentScope = z.object({
  id: z.string(),
  layer: AgentLayer,
  label: z.string(),
  granted: z.boolean(),
  // Letzte tatsächliche Nutzung dieses Rechts — Basis für die Hygiene-Regel.
  lastUsed: z.string().nullable(),
});
export type AgentScope = z.infer<typeof AgentScope>;

export const AgentActivity = z.object({
  id: z.string(),
  agentId: z.string(),
  ts: z.string(),
  action: z.string(),
  recipient: z.string().nullable(),
  status: z.enum(["ok", "flagged"]),
});
export type AgentActivity = z.infer<typeof AgentActivity>;

export const Agent = z.object({
  id: z.string(),
  name: z.string(),
  vendor: z.string(),
  purpose: z.string(),
  status: AgentStatus,
  lastActive: z.string(),
});
export type Agent = z.infer<typeof Agent>;

export const AgentCreate = Agent.omit({ id: true, status: true, lastActive: true }).extend({
  scopes: z.array(AgentScope.omit({ id: true, lastUsed: true })).default([]),
});
export const AgentUpdate = Agent.omit({ id: true }).partial();

// Server-derived agent view (exposure + hygiene + anomalies).
export const AgentDetail = Agent.extend({
  scopes: z.array(AgentScope),
  exposure: z.number(), // 0..100, layer-gewichtet
  trust: z.number(), // 0..100, invers zur Exposure + Anomalien
  hygieneFlags: z.array(z.string()), // z. B. "Grant > 6 Monate ungenutzt"
  anomalies: z.number(),
  log: z.array(AgentActivity),
});
export type AgentDetail = z.infer<typeof AgentDetail>;

export const ScopeUpdate = z.object({ granted: z.boolean() });

// ── Alerts (dashboard events + agent anomalies) ───────────────────────────────
export const Alert = z.object({
  id: z.string(),
  ts: z.string(),
  module: z.string(),
  title: z.string(),
  detail: z.string(),
  severity: z.enum(["info", "ok", "warn", "danger"]),
  relatedId: z.string().nullable(),
});
export type Alert = z.infer<typeof Alert>;

// ── Settings ──────────────────────────────────────────────────────────────────
export const VerificationStatus = z.enum(["verified", "pending", "unverified"]);
export const Verification = z.object({
  id: z.string(),
  label: z.string(),
  status: VerificationStatus,
  detail: z.string(),
});
export type Verification = z.infer<typeof Verification>;

export const Settings = z.object({
  toggles: z.record(z.boolean()),
  scanFrequency: z.string(),
  verifications: z.array(Verification),
});
export type Settings = z.infer<typeof Settings>;

export const SettingsUpdate = z.object({
  toggles: z.record(z.boolean()).optional(),
  scanFrequency: z.string().optional(),
});

// ── Dashboard ──────────────────────────────────────────────────────────────────
export const DashboardSummary = z.object({
  exposureScore: z.number(),
  scoreBand: z.enum(["stable", "watch", "elevated"]),
  stats: z.object({
    sourcesTracked: z.number(),
    openRisks: z.number(),
    activeLeaks: z.number(),
    agentAnomalies: z.number(),
  }),
  events: z.array(Alert),
});
export type DashboardSummary = z.infer<typeof DashboardSummary>;

// ── API error envelope ────────────────────────────────────────────────────────
export const ApiError = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});
export type ApiError = z.infer<typeof ApiError>;
