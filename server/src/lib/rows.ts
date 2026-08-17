// Mapper DB-Zeile → @icp/shared-Typen (JSON parsen, INTEGER→bool).
import type {
  IdentityFinding,
  ReputationSignal,
  Beneficiary,
  LegacyAsset,
  Agent,
  AgentScope,
  AgentActivity,
  Alert,
  Detection,
  OwnedAccount,
} from "@icp/shared";

/* eslint-disable @typescript-eslint/no-explicit-any */
export const toFinding = (r: any): IdentityFinding => ({
  id: r.id,
  title: r.title,
  category: r.category,
  source: r.source,
  sensitivity: r.sensitivity,
  risk: r.risk,
  exposedData: JSON.parse(r.exposed_data),
  discovered: r.discovered,
  lastSeen: r.last_seen,
  status: r.status,
  description: r.description,
  url: r.url ?? undefined,
  actions: JSON.parse(r.actions),
});

export const toSignal = (r: any): ReputationSignal => ({
  id: r.id,
  perspective: r.perspective,
  label: r.label,
  impact: r.impact,
  note: r.note,
});

export const toBeneficiary = (r: any): Beneficiary => ({
  id: r.id,
  name: r.name,
  relation: r.relation,
  email: r.email,
});

export const toAsset = (r: any): LegacyAsset => ({
  id: r.id,
  account: r.account,
  type: r.type,
  value: r.value,
  directive: r.directive,
  beneficiaryId: r.beneficiary_id ?? null,
  notes: r.notes,
});

export const toAgent = (r: any): Agent => ({
  id: r.id,
  name: r.name,
  vendor: r.vendor,
  purpose: r.purpose,
  status: r.status,
  lastActive: r.last_active,
});

export const toScope = (r: any): AgentScope => ({
  id: r.id,
  layer: r.layer,
  label: r.label,
  granted: !!r.granted,
  lastUsed: r.last_used ?? null,
});

export const toActivity = (r: any): AgentActivity => ({
  id: r.id,
  agentId: r.agent_id,
  ts: r.ts,
  action: r.action,
  recipient: r.recipient ?? null,
  status: r.status,
});

export const toDetection = (r: any): Detection => ({
  id: r.id,
  ts: r.ts,
  platform: r.platform,
  title: r.title,
  url: r.url,
  thumbnail: r.thumbnail ?? null,
  matchType: r.match_type,
  confidence: r.confidence,
  status: r.status,
  source: r.source,
  // Wird im Monitoring-Modul gegen die bekannten Konten neu berechnet.
  isKnown: false,
});

export const toOwnedAccount = (r: any): OwnedAccount => ({
  id: r.id,
  label: r.label,
  handle: r.handle ?? null,
  url: r.url ?? null,
  email: r.email ?? null,
});

export const toAlert = (r: any): Alert => ({
  id: r.id,
  ts: r.ts,
  module: r.module,
  title: r.title,
  detail: r.detail,
  severity: r.severity,
  relatedId: r.related_id ?? null,
});
