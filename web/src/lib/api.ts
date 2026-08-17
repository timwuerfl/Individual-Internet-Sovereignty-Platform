// Typed REST client for the backend. // TODO: backend — Auth-Header / echte Session.
import type {
  DashboardSummary,
  FindingPage,
  IdentityFinding,
  PerspectiveView,
  LegacyAsset,
  Beneficiary,
  Settings,
  AgentDetail,
  Detection,
  DetectionStatus,
  MonitoringScanResult,
  IdentityProfile,
  OwnedAccount,
  LeakScanResult,
} from "@icp/shared";

export interface MonitoringFeed {
  items: Detection[];
  summary: {
    total: number;
    new: number;
    reviewed: number;
    takedown_requested: number;
    dismissed: number;
    known: number;
  };
}

const BASE = "/api";

// Fake-Session: statischer Token (kein echtes Login, Schema bleibt multi-user-fähig).
const SESSION_TOKEN = "demo-session";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${SESSION_TOKEN}`,
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      message = body?.error?.message ?? message;
    } catch {
      /* non-JSON error */
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export interface FindingQueryArgs {
  q?: string;
  category?: string;
  sort?: "risk" | "recent" | "title";
  page?: number;
  pageSize?: number;
}

export const api = {
  dashboard: () => apiFetch<DashboardSummary>("/dashboard"),

  findings: (args: FindingQueryArgs = {}) => {
    const qs = new URLSearchParams();
    if (args.q) qs.set("q", args.q);
    if (args.category) qs.set("category", args.category);
    if (args.sort) qs.set("sort", args.sort);
    if (args.page) qs.set("page", String(args.page));
    if (args.pageSize) qs.set("pageSize", String(args.pageSize));
    const s = qs.toString();
    return apiFetch<FindingPage>(`/findings${s ? `?${s}` : ""}`);
  },
  finding: (id: string) => apiFetch<IdentityFinding>(`/findings/${id}`),

  reputation: () => apiFetch<PerspectiveView[]>("/reputation"),

  legacy: () => apiFetch<{ assets: LegacyAsset[]; beneficiaries: Beneficiary[] }>("/legacy"),
  createAsset: (body: Omit<LegacyAsset, "id">) =>
    apiFetch<LegacyAsset>("/legacy/assets", { method: "POST", body: JSON.stringify(body) }),
  updateAsset: (id: string, patch: Partial<Omit<LegacyAsset, "id">>) =>
    apiFetch<LegacyAsset>(`/legacy/assets/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  deleteAsset: (id: string) =>
    apiFetch<{ ok: boolean }>(`/legacy/assets/${id}`, { method: "DELETE" }),

  settings: () => apiFetch<Settings>("/settings"),
  updateSettings: (patch: { toggles?: Record<string, boolean>; scanFrequency?: string }) =>
    apiFetch<Settings>("/settings", { method: "PATCH", body: JSON.stringify(patch) }),

  agents: () => apiFetch<AgentDetail[]>("/agents"),
  agent: (id: string) => apiFetch<AgentDetail>(`/agents/${id}`),
  setScope: (agentId: string, scopeId: string, granted: boolean) =>
    apiFetch<AgentDetail>(`/agents/${agentId}/scopes/${scopeId}`, {
      method: "PATCH",
      body: JSON.stringify({ granted }),
    }),
  updateAgent: (id: string, patch: { status?: string }) =>
    apiFetch<AgentDetail>(`/agents/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  connectedApps: () =>
    apiFetch<{ apps: { id: string; name: string; url: string; note: string }[]; autoDetect: boolean }>(
      "/agents/connected-apps",
    ),

  // Monitoring (Bild-/Namens-Suche nach Fake-Accounts).
  monitoring: () => apiFetch<MonitoringFeed>("/monitoring"),
  scanMonitoring: (body: { imageUrl?: string; name?: string; terms?: string[] }) =>
    apiFetch<MonitoringScanResult>("/monitoring/scan", { method: "POST", body: JSON.stringify(body) }),
  updateDetection: (id: string, status: DetectionStatus) =>
    apiFetch<Detection>(`/monitoring/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),

  // Leaks.
  leaks: () => apiFetch<{ items: IdentityFinding[]; lastScan: string | null }>("/leaks"),
  scanLeaks: (email?: string) =>
    apiFetch<LeakScanResult>("/leaks/scan", { method: "POST", body: JSON.stringify(email ? { email } : {}) }),

  // Profil / eigene Identität.
  profile: () => apiFetch<IdentityProfile>("/profile"),
  updateProfile: (patch: { name?: string; aliases?: string[]; extraEmails?: string[] }) =>
    apiFetch<IdentityProfile>("/profile", { method: "PATCH", body: JSON.stringify(patch) }),
  createOwnedAccount: (body: { label: string; handle?: string; url?: string; email?: string }) =>
    apiFetch<OwnedAccount>("/profile/accounts", { method: "POST", body: JSON.stringify(body) }),
  updateOwnedAccount: (id: string, patch: { label?: string; handle?: string; url?: string; email?: string }) =>
    apiFetch<OwnedAccount>(`/profile/accounts/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  deleteOwnedAccount: (id: string) =>
    apiFetch<{ ok: boolean }>(`/profile/accounts/${id}`, { method: "DELETE" }),
};
