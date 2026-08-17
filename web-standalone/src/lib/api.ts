/**
 * Mock-API für die Standalone-Variante ("Zwischenschritt").
 *
 * Drop-in-Ersatz für den echten REST-Client: identische `api`-Schnittstelle,
 * aber ALLE Daten leben hier im Speicher. Kein Backend, kein Netzwerk — die
 * Seiten (Dashboard, Inventar, Wahrnehmung) bleiben unverändert.
 *
 * Datensatz und Ableitungen (Exposure-Score, Reputations-Tonalität,
 * Agenten-Logik) spiegeln den Server-Seed-Stand, damit beide Versionen
 * dasselbe Bild zeigen.
 */
import type {
  DashboardSummary,
  FindingPage,
  IdentityFinding,
  PerspectiveView,
  Perspective,
  ReputationSignal,
  LegacyAsset,
  Beneficiary,
  Settings,
  Verification,
  AgentDetail,
  Agent,
  AgentScope,
  AgentActivity,
  Alert,
  RiskLevel,
  FindingCategory,
  FindingStatus,
} from "@icp/shared";
import { LAYER_LABELS } from "@icp/shared";

// ── Künstliche Latenz, damit die Lade-Skeletons sichtbar bleiben ───────────────
const LATENCY = 280;
function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), LATENCY));
}

// ── Zeit-Helfer (relativ zu „jetzt", wie im Server-Seed) ───────────────────────
const now = Date.now();
const DAY = 86_400_000;
const iso = (daysAgo: number, hour = 10) =>
  new Date(now - daysAgo * DAY + (hour - 12) * 3_600_000).toISOString();
const ymd = (daysAgo: number) => new Date(now - daysAgo * DAY).toISOString().slice(0, 10);

// ── Findings ───────────────────────────────────────────────────────────────────
type FindingSeed = Omit<IdentityFinding, "discovered" | "lastSeen"> & {
  discoveredDaysAgo: number;
  lastSeenDaysAgo: number;
};

const FINDING_SEED: FindingSeed[] = [
  { id: "find-linkedin", title: "LinkedIn", category: "account", source: "Verknüpftes Konto", sensitivity: 0.3, risk: "low", exposedData: ["Name", "Beruf", "Werdegang", "Foto", "Kontakte"], discoveredDaysAgo: 1220, lastSeenDaysAgo: 2, status: "active", description: "Berufliches Profil mit vollständigem Werdegang. Öffentlich sichtbar, gut gepflegt.", url: "linkedin.com/in/lena-kessler", actions: ["Sichtbarkeit der Kontaktliste prüfen", "Aktivitäts-Broadcast einschränken"] },
  { id: "find-acxiom", title: "Acxiom — Verbraucherprofil", category: "broker", source: "Data-Broker-Abgleich", sensitivity: 0.8, risk: "high", exposedData: ["Name", "Anschrift (Verlauf)", "Kaufkraft-Segment", "Haushaltsgröße", "Interessen-Cluster"], discoveredDaysAgo: 200, lastSeenDaysAgo: 8, status: "active", description: "Aggregiertes Marketing-Profil aus eingekauften Datensätzen mit abgeleiteten Bonitäts- und Konsum-Segmenten.", actions: ["DSGVO-Auskunft anfragen", "Opt-out / Widerspruch einreichen"] },
  { id: "find-schufa", title: "SCHUFA", category: "broker", source: "Auskunftei", sensitivity: 0.7, risk: "medium", exposedData: ["Name", "Geburtsdatum", "Anschrift", "Score-Wert", "Vertragsdaten"], discoveredDaysAgo: 320, lastSeenDaysAgo: 21, status: "active", description: "Bonitätsdatensatz mit aktuellem Basisscore. Mehrere meldende Vertragspartner hinterlegt.", actions: ["Kostenlose Datenkopie (§34 BDSG) anfordern"] },
  { id: "find-leak-collection", title: "Daten-Leak — „Collection #5\"", category: "leak", source: "Breach-Monitoring", sensitivity: 0.95, risk: "critical", exposedData: ["E-Mail", "Passwort-Hash", "Klartext-Passwort (alt)", "IP-Adresse"], discoveredDaysAgo: 9, lastSeenDaysAgo: 9, status: "active", description: "Deine private E-Mail taucht in einer kombinierten Zugangsdaten-Sammlung auf. Ein altes Passwort liegt im Klartext vor.", actions: ["Passwort überall ändern", "2-Faktor-Authentifizierung aktivieren"] },
  { id: "find-yasni", title: "Yasni — Personensuche", category: "search", source: "Suchmaschinen-Treffer", sensitivity: 0.5, risk: "medium", exposedData: ["Name", "frühere Arbeitgeber", "Wohnort", "verlinkte Profile"], discoveredDaysAgo: 100, lastSeenDaysAgo: 16, status: "active", description: "Personen-Aggregator bündelt öffentlich auffindbare Treffer zu einem Profil. Teils veraltet.", url: "yasni.de/lena+kessler", actions: ["Eintrag-Korrektur beantragen", "Löschung veralteter Treffer"] },
  { id: "find-google", title: "Google-Konto", category: "account", source: "Verknüpftes Konto", sensitivity: 0.6, risk: "medium", exposedData: ["E-Mail", "Standortverlauf", "Suchverlauf", "YouTube-Aktivität", "Fotos"], discoveredDaysAgo: 1500, lastSeenDaysAgo: 0, status: "active", description: "Zentrales Konto mit umfangreicher Aktivitätshistorie. Standortverlauf reicht Jahre zurück.", actions: ["Standortverlauf pausieren", "Auto-Löschung auf 3 Monate stellen"] },
  { id: "find-meta", title: "Meta (Instagram)", category: "account", source: "Verknüpftes Konto", sensitivity: 0.35, risk: "low", exposedData: ["Name", "Fotos", "Follower-Graph", "Standort-Tags"], discoveredDaysAgo: 800, lastSeenDaysAgo: 3, status: "active", description: "Privates Profil. Wenige öffentliche Beiträge, Standort-Tags teils aktiv.", actions: ["Alte Standort-Tags entfernen"] },
  { id: "find-spokeo", title: "Spokeo — People Search", category: "broker", source: "Data-Broker-Abgleich", sensitivity: 0.85, risk: "high", exposedData: ["Name", "Telefonnummer", "Anschrift", "Verwandte", "Alter"], discoveredDaysAgo: 56, lastSeenDaysAgo: 12, status: "active", description: "US-Datenhändler bietet kostenpflichtige Detailberichte mit Telefonnummer und Verwandten-Verknüpfung an.", actions: ["Opt-out-Formular einreichen"] },
  { id: "find-xing", title: "XING", category: "account", source: "Suchmaschinen-Treffer", sensitivity: 0.25, risk: "low", exposedData: ["Name", "Beruf", "Branche"], discoveredDaysAgo: 1100, lastSeenDaysAgo: 80, status: "dormant", description: "Verwaistes Karriere-Profil. Seit über einem Jahr inaktiv, aber öffentlich.", url: "xing.com/profile/Lena_Kessler", actions: ["Profil deaktivieren oder aktualisieren"] },
  { id: "find-forum", title: "Hobbykoch-Forum (2009)", category: "search", source: "Suchmaschinen-Treffer", sensitivity: 0.2, risk: "low", exposedData: ["Pseudonym", "E-Mail (alt)", "Beiträge"], discoveredDaysAgo: 199, lastSeenDaysAgo: 120, status: "active", description: "Alte Forenbeiträge unter Pseudonym, über die alte E-Mail verknüpfbar. Geringe Tragweite.", actions: ["Account-Löschung beim Betreiber anfragen"] },
  { id: "find-leak-travel", title: "Data-Leak — Reisebuchungs-Portal", category: "leak", source: "Breach-Monitoring", sensitivity: 0.7, risk: "high", exposedData: ["Name", "E-Mail", "Reiseziele", "Buchungsdaten"], discoveredDaysAgo: 154, lastSeenDaysAgo: 154, status: "active", description: "Kundendatenbank eines Buchungsportals wurde offengelegt. Keine Zahlungsdaten, aber Reiseverhalten ableitbar.", actions: ["Phishing-Wachsamkeit erhöhen", "Konto beim Portal schließen"] },
  { id: "find-leak-fitness", title: "Data-Leak — Fitness-App", category: "leak", source: "Breach-Monitoring", sensitivity: 0.65, risk: "medium", exposedData: ["Name", "E-Mail", "Geburtsdatum", "Gewicht/Gesundheitswerte"], discoveredDaysAgo: 239, lastSeenDaysAgo: 239, status: "active", description: "Eine Fitness-Tracking-App hat Nutzerdaten offengelegt, inkl. abgeleiteter Gesundheitswerte.", actions: ["Konto bei der App schließen", "Gesundheitsdaten-Freigaben prüfen"] },
  { id: "find-pinterest", title: "Pinterest", category: "account", source: "Verknüpftes Konto", sensitivity: 0.15, risk: "low", exposedData: ["Name", "Interessen", "Pinnwände"], discoveredDaysAgo: 1300, lastSeenDaysAgo: 220, status: "dormant", description: "Kaum genutztes Konto. Pinnwände geben Interessen preis, aber unkritisch.", actions: [] },
];

const FINDINGS: IdentityFinding[] = FINDING_SEED.map(({ discoveredDaysAgo, lastSeenDaysAgo, ...rest }) => ({
  ...rest,
  discovered: ymd(discoveredDaysAgo),
  lastSeen: ymd(lastSeenDaysAgo),
}));

// ── Exposure-Score (identisch zur Server-Formel) ───────────────────────────────
const RISK_WEIGHT: Record<RiskLevel, number> = { low: 0.25, medium: 0.5, high: 0.8, critical: 1.0 };
const REACH_WEIGHT: Record<FindingCategory, number> = { leak: 1.0, broker: 0.85, search: 0.6, account: 0.45 };
const STATUS_MULTIPLIER: Record<FindingStatus, number> = { active: 1.0, dormant: 0.35, removed: 0.0 };
const SCORE_REFERENCE = 7.5;

function findingScore(f: IdentityFinding): number {
  return RISK_WEIGHT[f.risk] * REACH_WEIGHT[f.category] * STATUS_MULTIPLIER[f.status] * (0.5 + 0.5 * f.sensitivity);
}
function exposureScore(findings: IdentityFinding[]): number {
  const raw = findings.reduce((sum, f) => sum + findingScore(f), 0);
  return Math.round(Math.max(0, Math.min(100, (raw / SCORE_REFERENCE) * 100)));
}
function scoreBand(score: number): "stable" | "watch" | "elevated" {
  if (score >= 70) return "elevated";
  if (score >= 45) return "watch";
  return "stable";
}

const RISK_ORDER: Record<RiskLevel, number> = { critical: 4, high: 3, medium: 2, low: 1 };

// ── Reputation ───────────────────────────────────────────────────────────────
const SIGNAL_SEED: Omit<ReputationSignal, "id">[] = [
  { perspective: "recruiter", label: "LinkedIn vollständig & gepflegt", impact: "positive", note: "Lückenloser Werdegang, klare Rollenbeschreibung." },
  { perspective: "recruiter", label: "Fachbeiträge auffindbar", impact: "positive", note: "Zwei zitierte Artikel stärken die Glaubwürdigkeit." },
  { perspective: "recruiter", label: "Verwaistes XING-Profil", impact: "negative", note: "Veraltete Angaben können widersprüchlich wirken." },
  { perspective: "insurer", label: "Acxiom-Konsumsegmente", impact: "negative", note: "Abgeleitete Risiko- und Kaufkraft-Merkmale ohne dein Zutun." },
  { perspective: "insurer", label: "Aktiver Standortverlauf", impact: "negative", note: "Mobilitätsmuster sind potenziell für Tarifierung relevant." },
  { perspective: "insurer", label: "Keine öffentlichen Gesundheitsdaten", impact: "positive", note: "Keine sensiblen medizinischen Spuren öffentlich auffindbar." },
  { perspective: "public", label: "Klartext-Passwort im Leak", impact: "negative", note: "Kritisch, falls anderswo wiederverwendet." },
  { perspective: "public", label: "Spokeo: Telefon + Verwandte", impact: "negative", note: "Erleichtert gezieltes Social Engineering." },
  { perspective: "public", label: "Name häufig — gewisse Verdünnung", impact: "positive", note: "Mehrere Namensvettern erschweren eindeutige Zuordnung." },
];
const SIGNALS: ReputationSignal[] = SIGNAL_SEED.map((x, i) => ({ ...x, id: `sig-${i + 1}` }));

const REP_LABEL: Record<Perspective, string> = { recruiter: "Recruiter", insurer: "Versicherer", public: "Öffentlichkeit" };
const REP_SUMMARY: Record<Perspective, string> = {
  recruiter: "Ein:e Recruiter:in sieht ein kohärentes, kompetentes Berufsbild. Werdegang und öffentliche Beiträge stützen einander; kaum Reibungspunkte.",
  insurer: "Aus Sicht eines datengetriebenen Versicherers entsteht ein erstaunlich detailliertes Bild — vor allem aus Broker-Profilen und Standortdaten, nicht aus dem, was du bewusst teilst.",
  public: "Für eine breite, anonyme Öffentlichkeit ist das größte Problem nicht, was du zeigst — sondern was zusammengeführt werden kann. Leak-Daten plus Personensuchen ermöglichen Re-Identifizierung.",
};
const PERSPECTIVES: Perspective[] = ["recruiter", "insurer", "public"];

function deriveTone(signals: ReputationSignal[]): PerspectiveView["tone"] {
  const pos = signals.filter((s) => s.impact === "positive").length;
  const neg = signals.filter((s) => s.impact === "negative").length;
  if (neg === 0 && pos > 0) return "positive";
  if (neg > pos) return "risk";
  if (neg > 0) return "mixed";
  return "neutral";
}
function buildPerspectiveView(perspective: Perspective): PerspectiveView {
  const relevant = SIGNALS.filter((s) => s.perspective === perspective);
  return {
    perspective,
    label: REP_LABEL[perspective],
    tone: deriveTone(relevant),
    summary: REP_SUMMARY[perspective],
    signals: relevant,
    recommendations: relevant.filter((s) => s.impact === "negative").map((s) => `${s.label}: ${s.note}`),
  };
}

// ── Digitaler Nachlass (mutierbar) ─────────────────────────────────────────────
const BENEFICIARIES: Beneficiary[] = [
  { id: "ben-1", name: "Jonas Kessler", relation: "Bruder", email: "jonas.k@example.de" },
  { id: "ben-2", name: "Marlene Vogt", relation: "Partnerin", email: "m.vogt@example.de" },
  { id: "ben-3", name: "Dr. Anke Reimann", relation: "Notarin", email: "kanzlei@reimann-notar.de" },
];
let ASSETS: LegacyAsset[] = [
  { id: "leg-google", account: "Google-Konto", type: "email", value: "E-Mail, Fotos (12 Jahre), Dokumente", directive: "transfer", beneficiaryId: "ben-2", notes: "Familienfotos an Marlene übergeben, danach Konto schließen." },
  { id: "leg-instagram", account: "Instagram", type: "social", value: "Privates Profil, ~400 Beiträge", directive: "memorialize", beneficiaryId: "ben-1", notes: "In Gedenkzustand versetzen, keine neuen Logins." },
  { id: "leg-bank", account: "DKB Girokonto", type: "financial", value: "Girokonto, Daueraufträge", directive: "transfer", beneficiaryId: "ben-3", notes: "Abwicklung über Notariat Reimann. Vollmacht hinterlegt." },
  { id: "leg-crypto", account: "Ledger Wallet", type: "crypto", value: "Kryptowerte (Seed-Phrase offline)", directive: "transfer", beneficiaryId: "ben-1", notes: "Seed-Phrase im Bankschließfach. Zugang nur über Notariat." },
  { id: "leg-linkedin", account: "LinkedIn", type: "social", value: "Berufliches Profil", directive: "delete", beneficiaryId: null, notes: "Vollständig löschen." },
  { id: "leg-spotify", account: "Spotify Premium", type: "subscription", value: "Abo, Playlists", directive: "delete", beneficiaryId: null, notes: "Abo kündigen, Playlists vorher exportieren." },
  { id: "leg-dropbox", account: "Dropbox", type: "cloud", value: "Archiv, Projektdateien", directive: "undecided", beneficiaryId: null, notes: "" },
];
let assetSeq = 0;

// ── Einstellungen (mutierbar) ──────────────────────────────────────────────────
const VERIFICATIONS: Verification[] = [
  { id: "email", label: "E-Mail", status: "verified", detail: "lena.kessler@example.de" },
  { id: "phone", label: "Telefonnummer", status: "verified", detail: "+49 151 ••• ••72" },
  { id: "eid", label: "Personalausweis (eID)", status: "verified", detail: "Verifiziert am 04.03.2024" },
  { id: "address", label: "Wohnanschrift", status: "pending", detail: "Nachweis hochgeladen — in Prüfung" },
  { id: "biometric", label: "Biometrischer Referenz-Hash", status: "unverified", detail: "Für Deepfake-Abgleich — noch nicht hinterlegt" },
];
const SETTINGS: Settings = {
  scanFrequency: "daily",
  toggles: { "local-first": true, e2e: true, "ml-consent": true, "broker-autoscan": false },
  verifications: VERIFICATIONS,
};

// ── Alerts (Dashboard-Ereignisse) ───────────────────────────────────────────────
type AlertSeed = Omit<Alert, "id" | "ts"> & { daysAgo: number; hour: number };
const ALERT_SEED: AlertSeed[] = [
  { daysAgo: 1, hour: 23, module: "Agenten-Monitoring", title: "Anomalie beim Reise-Planer", detail: "Zahlungsversuch außerhalb erlaubter Scopes und Zugriff zu untypischer Zeit.", severity: "danger", relatedId: "ag-travel" },
  { daysAgo: 9, hour: 19, module: "Identitäts-Inventar", title: "Neuer Daten-Leak gefunden", detail: "Deine E-Mail erscheint in „Collection #5\" inkl. altem Klartext-Passwort.", severity: "danger", relatedId: "find-leak-collection" },
  { daysAgo: 8, hour: 11, module: "Datenrechte", title: "Acxiom hat Auskunft bestätigt", detail: "Eingangsbestätigung erhalten. Frist für Vollauskunft läuft.", severity: "info", relatedId: null },
  { daysAgo: 12, hour: 14, module: "Identitäts-Inventar", title: "Spokeo-Eintrag aktualisiert", detail: "Telefonnummer und Verwandten-Verknüpfung neu sichtbar.", severity: "warn", relatedId: "find-spokeo" },
  { daysAgo: 16, hour: 9, module: "Wahrnehmung", title: "Recruiter-Einschätzung verbessert", detail: "Aktualisiertes LinkedIn-Profil wirkt sich positiv aus.", severity: "ok", relatedId: null },
  { daysAgo: 21, hour: 16, module: "Datenrechte", title: "SCHUFA-Datenkopie eingegangen", detail: "Basisscore und gemeldete Vertragspartner einsehbar.", severity: "ok", relatedId: null },
];
const ALERTS: Alert[] = ALERT_SEED
  .map(({ daysAgo, hour, ...rest }, i) => ({ ...rest, id: `alert-${i + 1}`, ts: iso(daysAgo, hour) }))
  .sort((a, b) => b.ts.localeCompare(a.ts));

// ── Agenten (mutierbar) + Logik ─────────────────────────────────────────────────
const SIX_MONTHS_MS = 182 * DAY;
const FREQUENCY_THRESHOLD_24H = 8;
const LAYER_WEIGHT: Record<number, number> = { 0: 0.2, 1: 0.5, 2: 0.8, 3: 1.0, 4: 0.6 };
const MAX_WEIGHT = Object.values(LAYER_WEIGHT).reduce((a, b) => a + b, 0);

function agentExposure(scopes: AgentScope[]): number {
  const sum = scopes.filter((s) => s.granted).reduce((acc, s) => acc + (LAYER_WEIGHT[s.layer] ?? 0), 0);
  return Math.round((sum / MAX_WEIGHT) * 100);
}
function hygieneFlags(agent: Agent, scopes: AgentScope[]): string[] {
  const flags: string[] = [];
  for (const s of scopes) {
    if (!s.granted || !s.lastUsed) continue;
    if (now - new Date(s.lastUsed).getTime() > SIX_MONTHS_MS) {
      flags.push(`Recht „${s.label}" (${LAYER_LABELS[s.layer]}) seit über 6 Monaten ungenutzt`);
    }
  }
  if (now - new Date(agent.lastActive).getTime() > SIX_MONTHS_MS) {
    flags.push("Agent seit über 6 Monaten inaktiv — Zugriff überprüfen");
  }
  return flags;
}
function detectAnomalies(activities: AgentActivity[]): number {
  let count = activities.filter((a) => a.status === "flagged").length;
  const since = now - DAY;
  const recent = activities.filter((a) => new Date(a.ts).getTime() >= since);
  if (recent.length > FREQUENCY_THRESHOLD_24H) count += 1;
  return count;
}
function agentTrust(exposure: number, anomalies: number): number {
  return Math.max(0, Math.min(100, Math.round(100 - exposure * 0.5 - anomalies * 20)));
}

type AgentStore = {
  agent: Agent;
  scopes: AgentScope[];
  activities: AgentActivity[];
};
type AgentSeed = {
  id: string; name: string; vendor: string; purpose: string;
  status: Agent["status"]; lastActiveDaysAgo: number;
  scopes: { layer: AgentScope["layer"]; label: string; granted: boolean; lastUsedDaysAgo: number | null }[];
  activities: { daysAgo: number; hour?: number; action: string; recipient?: string; status: AgentActivity["status"] }[];
};
const AGENT_SEED: AgentSeed[] = [
  {
    id: "ag-shopping", name: "Beschaffungs-Assistent", vendor: "Mercato AI",
    purpose: "Vergleicht Preise und tätigt freigegebene Käufe bis 150 €.",
    status: "active", lastActiveDaysAgo: 0,
    scopes: [
      { layer: 0, label: "Identitätsnachweis nutzen", granted: true, lastUsedDaysAgo: 0 },
      { layer: 1, label: "Bestellhistorie lesen", granted: true, lastUsedDaysAgo: 1 },
      { layer: 2, label: "Zahlungen bis 150 € auslösen", granted: true, lastUsedDaysAgo: 1 },
      { layer: 2, label: "Konto-Stammdaten ändern", granted: false, lastUsedDaysAgo: null },
    ],
    activities: [
      { daysAgo: 0, hour: 8, action: "Preisvergleich für „Kaffeebohnen 1 kg\"", status: "ok" },
      { daysAgo: 1, hour: 18, action: "Bestellung ausgelöst — 23,90 €", status: "ok" },
      { daysAgo: 3, action: "Warenkorb aktualisiert", status: "ok" },
    ],
  },
  {
    id: "ag-travel", name: "Reise-Planer", vendor: "Voyage Copilot",
    purpose: "Sucht und reserviert Reisen im Rahmen deiner Vorgaben.",
    status: "anomaly", lastActiveDaysAgo: 1,
    scopes: [
      { layer: 1, label: "Kalender lesen", granted: true, lastUsedDaysAgo: 2 },
      { layer: 1, label: "Kontakte lesen", granted: true, lastUsedDaysAgo: 1 },
      { layer: 2, label: "Reisen reservieren (ohne Zahlung)", granted: true, lastUsedDaysAgo: 3 },
      { layer: 2, label: "Zahlungen auslösen", granted: false, lastUsedDaysAgo: null },
      { layer: 3, label: "Reisedaten zum Training freigeben", granted: true, lastUsedDaysAgo: 2 },
    ],
    activities: [
      { daysAgo: 1, hour: 23, action: "Zahlungsversuch 612 € außerhalb erlaubter Scopes", recipient: "booking-gateway", status: "flagged" },
      { daysAgo: 1, hour: 23, action: "Zugriff auf Kontakte um 23:47 (untypische Zeit)", status: "flagged" },
      { daysAgo: 2, hour: 9, action: "Hotelsuche Lissabon", status: "ok" },
    ],
  },
  {
    id: "ag-inbox", name: "Posteingangs-Sortierer", vendor: "Eigenbetrieb (lokal)",
    purpose: "Kategorisiert E-Mails und entwirft Antworten zur Freigabe.",
    status: "active", lastActiveDaysAgo: 0,
    scopes: [
      { layer: 1, label: "E-Mails lesen", granted: true, lastUsedDaysAgo: 0 },
      { layer: 2, label: "Labels setzen", granted: true, lastUsedDaysAgo: 0 },
      { layer: 2, label: "Entwürfe erstellen", granted: true, lastUsedDaysAgo: 0 },
      { layer: 2, label: "E-Mails senden", granted: false, lastUsedDaysAgo: null },
    ],
    activities: [
      { daysAgo: 0, hour: 8, action: "14 E-Mails kategorisiert", status: "ok" },
      { daysAgo: 0, hour: 8, action: "2 Antwort-Entwürfe erstellt", status: "ok" },
    ],
  },
  {
    id: "ag-subs", name: "Abo-Manager", vendor: "Mercato AI",
    purpose: "Überwacht Abos und kündigt ungenutzte nach Freigabe.",
    status: "paused", lastActiveDaysAgo: 220,
    scopes: [
      { layer: 1, label: "Abrechnungs-E-Mails lesen", granted: true, lastUsedDaysAgo: 220 },
      { layer: 3, label: "Zahlungs-Token gespeichert", granted: true, lastUsedDaysAgo: 240 },
      { layer: 2, label: "Kündigungen einreichen", granted: false, lastUsedDaysAgo: null },
    ],
    activities: [
      { daysAgo: 220, action: "3 ungenutzte Abos erkannt", status: "ok" },
      { daysAgo: 220, action: "Vom Nutzer pausiert", status: "ok" },
    ],
  },
];

const AGENTS: AgentStore[] = AGENT_SEED.map((x) => ({
  agent: { id: x.id, name: x.name, vendor: x.vendor, purpose: x.purpose, status: x.status, lastActive: iso(x.lastActiveDaysAgo) },
  scopes: x.scopes.map((g, i) => ({
    id: `${x.id}-sc${i}`,
    layer: g.layer,
    label: g.label,
    granted: g.granted,
    lastUsed: g.lastUsedDaysAgo == null ? null : iso(g.lastUsedDaysAgo),
  })),
  activities: x.activities.map((l, i) => ({
    id: `${x.id}-ac${i}`,
    agentId: x.id,
    ts: iso(l.daysAgo, l.hour ?? 10),
    action: l.action,
    recipient: l.recipient ?? null,
    status: l.status,
  })),
}));

function buildAgentDetail(store: AgentStore): AgentDetail {
  const exposure = agentExposure(store.scopes);
  const anomalies = detectAnomalies(store.activities);
  return {
    ...store.agent,
    status: anomalies > 0 ? "anomaly" : store.agent.status,
    scopes: store.scopes,
    exposure,
    trust: agentTrust(exposure, anomalies),
    hygieneFlags: hygieneFlags(store.agent, store.scopes),
    anomalies,
    log: [...store.activities].sort((a, b) => b.ts.localeCompare(a.ts)),
  };
}

// ── Öffentliche Mock-API (identische Signatur wie der echte Client) ────────────
export interface FindingQueryArgs {
  q?: string;
  category?: string;
  sort?: "risk" | "recent" | "title";
  page?: number;
  pageSize?: number;
}

export const api = {
  dashboard: (): Promise<DashboardSummary> => {
    const score = exposureScore(FINDINGS);
    const agentAnomalies = AGENTS.reduce((sum, a) => sum + detectAnomalies(a.activities), 0);
    return delay({
      exposureScore: score,
      scoreBand: scoreBand(score),
      stats: {
        sourcesTracked: FINDINGS.length,
        openRisks: FINDINGS.filter((f) => f.status === "active" && (f.risk === "high" || f.risk === "critical")).length,
        activeLeaks: FINDINGS.filter((f) => f.category === "leak" && f.status === "active").length,
        agentAnomalies,
      },
      events: ALERTS,
    });
  },

  findings: (args: FindingQueryArgs = {}): Promise<FindingPage> => {
    const page = args.page ?? 1;
    const pageSize = args.pageSize ?? 50;
    const sort = args.sort ?? "risk";
    let items = FINDINGS.slice();
    if (args.category) items = items.filter((f) => f.category === args.category);
    if (args.q) {
      const q = args.q.toLowerCase();
      items = items.filter(
        (f) =>
          f.title.toLowerCase().includes(q) ||
          f.source.toLowerCase().includes(q) ||
          f.exposedData.some((d) => d.toLowerCase().includes(q)),
      );
    }
    items.sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title);
      if (sort === "recent") return b.lastSeen.localeCompare(a.lastSeen);
      return RISK_ORDER[b.risk] - RISK_ORDER[a.risk];
    });
    const total = items.length;
    const start = (page - 1) * pageSize;
    return delay({ items: items.slice(start, start + pageSize), total, page, pageSize });
  },

  finding: (id: string): Promise<IdentityFinding> => {
    const f = FINDINGS.find((x) => x.id === id);
    if (!f) return Promise.reject(new Error("Fundstelle nicht gefunden"));
    return delay(f);
  },

  reputation: (): Promise<PerspectiveView[]> => delay(PERSPECTIVES.map(buildPerspectiveView)),

  legacy: (): Promise<{ assets: LegacyAsset[]; beneficiaries: Beneficiary[] }> =>
    delay({ assets: ASSETS.slice(), beneficiaries: BENEFICIARIES.slice() }),
  createAsset: (body: Omit<LegacyAsset, "id">): Promise<LegacyAsset> => {
    const asset: LegacyAsset = { ...body, id: `leg-new-${++assetSeq}` };
    ASSETS = [...ASSETS, asset];
    return delay(asset);
  },
  updateAsset: (id: string, patch: Partial<Omit<LegacyAsset, "id">>): Promise<LegacyAsset> => {
    const idx = ASSETS.findIndex((a) => a.id === id);
    if (idx === -1) return Promise.reject(new Error("Asset nicht gefunden"));
    ASSETS[idx] = { ...ASSETS[idx], ...patch };
    return delay(ASSETS[idx]);
  },
  deleteAsset: (id: string): Promise<{ ok: boolean }> => {
    ASSETS = ASSETS.filter((a) => a.id !== id);
    return delay({ ok: true });
  },

  settings: (): Promise<Settings> => delay({ ...SETTINGS, toggles: { ...SETTINGS.toggles } }),
  updateSettings: (patch: { toggles?: Record<string, boolean>; scanFrequency?: string }): Promise<Settings> => {
    if (patch.toggles) SETTINGS.toggles = { ...SETTINGS.toggles, ...patch.toggles };
    if (patch.scanFrequency) SETTINGS.scanFrequency = patch.scanFrequency;
    return delay({ ...SETTINGS, toggles: { ...SETTINGS.toggles } });
  },

  agents: (): Promise<AgentDetail[]> => delay(AGENTS.map(buildAgentDetail)),
  agent: (id: string): Promise<AgentDetail> => {
    const store = AGENTS.find((a) => a.agent.id === id);
    if (!store) return Promise.reject(new Error("Agent nicht gefunden"));
    return delay(buildAgentDetail(store));
  },
  setScope: (agentId: string, scopeId: string, granted: boolean): Promise<AgentDetail> => {
    const store = AGENTS.find((a) => a.agent.id === agentId);
    if (!store) return Promise.reject(new Error("Agent nicht gefunden"));
    const scope = store.scopes.find((s) => s.id === scopeId);
    if (scope) scope.granted = granted;
    return delay(buildAgentDetail(store));
  },
  updateAgent: (id: string, patch: { status?: string }): Promise<AgentDetail> => {
    const store = AGENTS.find((a) => a.agent.id === id);
    if (!store) return Promise.reject(new Error("Agent nicht gefunden"));
    if (patch.status === "active" || patch.status === "paused" || patch.status === "anomaly") {
      store.agent.status = patch.status;
    }
    return delay(buildAgentDetail(store));
  },
  connectedApps: (): Promise<{ apps: { id: string; name: string; url: string; note: string }[]; autoDetect: boolean }> =>
    delay({
      apps: [
        { id: "app-mercato", name: "Mercato AI", url: "mercato.ai", note: "2 Agenten verbunden" },
        { id: "app-voyage", name: "Voyage Copilot", url: "voyage.app", note: "1 Agent · Anomalie offen" },
      ],
      autoDetect: false,
    }),
};
