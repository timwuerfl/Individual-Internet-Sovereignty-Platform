// Identitäts-Helfer: sammelt Namen, E-Mails und bekannte eigene Konten des
// Nutzers aus users + settings + owned_accounts + Inventar-Fundstellen.
// Wird von Leak-Scan, Monitoring-Scan und dem Profil-Modul gemeinsam genutzt.
import type { DB } from "../db.js";
import { DEMO_USER_ID } from "../db.js";

export interface IdentitySnapshot {
  name: string;
  aliases: string[];
  extraEmails: string[];
  names: string[]; // name + aliases (dedupliziert)
  emails: string[]; // user.email + extraEmails + account-emails (dedupliziert)
  knownUrls: string[]; // normalisierte URLs eigener Konten
  hostHandles: { host: string; handle: string }[]; // Plattform+Handle eigener Konten
}

const uniq = (xs: string[]): string[] => [...new Set(xs.map((x) => x.trim()).filter(Boolean))];

export function normUrl(u: string): string {
  return u
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("#")[0]
    .split("?")[0]
    .replace(/\/+$/, "");
}

function hostOf(u: string): string {
  try {
    return new URL(u.startsWith("http") ? u : `https://${u}`).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function readJson<T>(db: DB, key: string, fallback: T): T {
  const row = db.prepare("SELECT value FROM settings WHERE user_id = ? AND key = ?").get(DEMO_USER_ID, key) as
    | { value: string }
    | undefined;
  if (!row) return fallback;
  try {
    return JSON.parse(row.value) as T;
  } catch {
    return fallback;
  }
}

export function loadIdentity(db: DB): IdentitySnapshot {
  const user = db.prepare("SELECT name, email FROM users WHERE id = ?").get(DEMO_USER_ID) as
    | { name: string; email: string }
    | undefined;
  const aliases = readJson<string[]>(db, "nameAliases", []);
  const extraEmails = readJson<string[]>(db, "extraEmails", []);
  const knownAccountsSetting = readJson<string[]>(db, "knownAccounts", []);

  const accounts = db
    .prepare("SELECT url, handle, email FROM owned_accounts WHERE user_id = ?")
    .all(DEMO_USER_ID) as { url: string | null; handle: string | null; email: string | null }[];
  const findingUrls = (
    db
      .prepare("SELECT url FROM findings WHERE user_id = ? AND category = 'account' AND url IS NOT NULL")
      .all(DEMO_USER_ID) as { url: string }[]
  ).map((r) => r.url);

  const names = uniq([user?.name ?? "", ...aliases]);
  const emails = uniq([
    user?.email ?? "",
    ...extraEmails,
    ...accounts.map((a) => a.email ?? ""),
  ]).filter((e) => /.+@.+\..+/.test(e));

  const knownUrls = uniq(
    [...findingUrls, ...accounts.map((a) => a.url ?? ""), ...knownAccountsSetting].map(normUrl),
  );
  const hostHandles = accounts
    .filter((a) => a.handle)
    .map((a) => ({ host: a.url ? hostOf(a.url) : "", handle: (a.handle as string).toLowerCase().replace(/^@/, "") }))
    .filter((h) => h.handle);

  return {
    name: user?.name ?? "",
    aliases,
    extraEmails,
    names,
    emails,
    knownUrls,
    hostHandles,
  };
}

// Gehört eine Treffer-URL zu einem bekannten eigenen Konto?
export function isOwnUrl(snap: IdentitySnapshot, url: string): boolean {
  const n = normUrl(url);
  if (snap.knownUrls.some((k) => n === k || n.startsWith(`${k}/`) || k.startsWith(`${n}/`))) return true;
  const host = hostOf(url);
  if (!host) return false;
  const segs = n.split("/").slice(1); // Host abtrennen → nur Pfadsegmente
  return snap.hostHandles.some((h) => h.host === host && segs.includes(h.handle));
}
