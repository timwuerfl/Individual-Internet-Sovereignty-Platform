import type { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import {
  ProfileUpdate,
  OwnedAccountCreate,
  OwnedAccountUpdate,
  type IdentityProfile,
} from "@icp/shared";
import type { DB } from "../db.js";
import { DEMO_USER_ID } from "../db.js";
import { toOwnedAccount } from "../lib/rows.js";
import { loadIdentity } from "../lib/identity.js";
import { notFound } from "../lib/errors.js";

export function registerProfile(app: FastifyInstance, db: DB) {
  const setSetting = (key: string, value: unknown) =>
    db
      .prepare(
        `INSERT INTO settings (user_id, key, value) VALUES (?, ?, ?)
         ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value`,
      )
      .run(DEMO_USER_ID, key, JSON.stringify(value));

  const accounts = () =>
    db.prepare("SELECT * FROM owned_accounts WHERE user_id = ? ORDER BY created_at").all(DEMO_USER_ID).map(toOwnedAccount);

  const profile = (): IdentityProfile => {
    const id = loadIdentity(db);
    return {
      name: id.name,
      aliases: id.aliases,
      extraEmails: id.extraEmails,
      emails: id.emails,
      accounts: accounts(),
    };
  };

  // ── Profil lesen / Identitäts-Felder aktualisieren ──────────────────────────────
  app.get("/api/profile", () => profile());

  app.patch("/api/profile", (req) => {
    const patch = ProfileUpdate.parse(req.body);
    if (patch.name) db.prepare("UPDATE users SET name = ? WHERE id = ?").run(patch.name, DEMO_USER_ID);
    if (patch.aliases) setSetting("nameAliases", [...new Set(patch.aliases.map((s) => s.trim()).filter(Boolean))]);
    if (patch.extraEmails)
      setSetting("extraEmails", [...new Set(patch.extraEmails.map((s) => s.trim()).filter(Boolean))]);
    return profile();
  });

  // ── Eigene Konten (CRUD) ────────────────────────────────────────────────────────
  const clean = (v?: string) => (v && v.trim() ? v.trim() : null);

  app.post("/api/profile/accounts", (req, reply) => {
    const body = OwnedAccountCreate.parse(req.body);
    const id = `own-${randomUUID().slice(0, 8)}`;
    db.prepare(
      "INSERT INTO owned_accounts (id,user_id,label,handle,url,email,created_at) VALUES (?,?,?,?,?,?,?)",
    ).run(id, DEMO_USER_ID, body.label.trim(), clean(body.handle), clean(body.url), clean(body.email), new Date().toISOString());
    reply.code(201);
    return toOwnedAccount(db.prepare("SELECT * FROM owned_accounts WHERE id = ?").get(id));
  });

  app.patch<{ Params: { id: string } }>("/api/profile/accounts/:id", (req) => {
    const existing = db
      .prepare("SELECT * FROM owned_accounts WHERE user_id = ? AND id = ?")
      .get(DEMO_USER_ID, req.params.id);
    if (!existing) throw notFound("Konto");
    const patch = OwnedAccountUpdate.parse(req.body);
    const merged = { ...toOwnedAccount(existing) };
    if (patch.label !== undefined) merged.label = patch.label.trim();
    if (patch.handle !== undefined) merged.handle = clean(patch.handle);
    if (patch.url !== undefined) merged.url = clean(patch.url);
    if (patch.email !== undefined) merged.email = clean(patch.email);
    db.prepare("UPDATE owned_accounts SET label=?,handle=?,url=?,email=? WHERE id=? AND user_id=?").run(
      merged.label, merged.handle, merged.url, merged.email, req.params.id, DEMO_USER_ID,
    );
    return toOwnedAccount(db.prepare("SELECT * FROM owned_accounts WHERE id = ?").get(req.params.id));
  });

  app.delete<{ Params: { id: string } }>("/api/profile/accounts/:id", (req) => {
    const res = db.prepare("DELETE FROM owned_accounts WHERE user_id = ? AND id = ?").run(DEMO_USER_ID, req.params.id);
    if (res.changes === 0) throw notFound("Konto");
    return { ok: true };
  });

  // Hilfs-Endpoint: aktuelle Suchbegriffe (Name + Aliasse + Handles) für den Fake-Account-Scan.
  app.get("/api/profile/search-terms", () => {
    const id = loadIdentity(db);
    const terms = [...new Set([...id.names, ...id.hostHandles.map((h) => h.handle)])];
    return { terms, emails: id.emails };
  });
}
