import type { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import {
  LegacyAssetCreate,
  LegacyAssetUpdate,
  BeneficiaryCreate,
  BeneficiaryUpdate,
} from "@icp/shared";
import type { DB } from "../db.js";
import { DEMO_USER_ID } from "../db.js";
import { toAsset, toBeneficiary } from "../lib/rows.js";
import { notFound } from "../lib/errors.js";

export function registerLegacy(app: FastifyInstance, db: DB) {
  const allAssets = () =>
    db.prepare("SELECT * FROM legacy_assets WHERE user_id = ?").all(DEMO_USER_ID).map(toAsset);
  const allBeneficiaries = () =>
    db.prepare("SELECT * FROM beneficiaries WHERE user_id = ?").all(DEMO_USER_ID).map(toBeneficiary);

  app.get("/api/legacy", () => ({ assets: allAssets(), beneficiaries: allBeneficiaries() }));

  // ── Assets ──────────────────────────────────────────────────────────────────
  app.post("/api/legacy/assets", (req, reply) => {
    const body = LegacyAssetCreate.parse(req.body);
    const id = `leg-${randomUUID().slice(0, 8)}`;
    db.prepare(
      `INSERT INTO legacy_assets (id,user_id,account,type,value,directive,beneficiary_id,notes)
       VALUES (?,?,?,?,?,?,?,?)`,
    ).run(id, DEMO_USER_ID, body.account, body.type, body.value, body.directive, body.beneficiaryId, body.notes);
    reply.code(201);
    return toAsset(db.prepare("SELECT * FROM legacy_assets WHERE id = ?").get(id));
  });

  app.patch<{ Params: { id: string } }>("/api/legacy/assets/:id", (req) => {
    const existing = db
      .prepare("SELECT * FROM legacy_assets WHERE user_id = ? AND id = ?")
      .get(DEMO_USER_ID, req.params.id);
    if (!existing) throw notFound("Asset");
    const patch = LegacyAssetUpdate.parse(req.body);
    const merged = { ...toAsset(existing), ...patch };
    db.prepare(
      `UPDATE legacy_assets SET account=?,type=?,value=?,directive=?,beneficiary_id=?,notes=?
       WHERE id=? AND user_id=?`,
    ).run(merged.account, merged.type, merged.value, merged.directive, merged.beneficiaryId, merged.notes, req.params.id, DEMO_USER_ID);
    return toAsset(db.prepare("SELECT * FROM legacy_assets WHERE id = ?").get(req.params.id));
  });

  app.delete<{ Params: { id: string } }>("/api/legacy/assets/:id", (req) => {
    const res = db
      .prepare("DELETE FROM legacy_assets WHERE user_id = ? AND id = ?")
      .run(DEMO_USER_ID, req.params.id);
    if (res.changes === 0) throw notFound("Asset");
    return { ok: true };
  });

  // ── Beneficiaries ─────────────────────────────────────────────────────────────
  app.post("/api/legacy/beneficiaries", (req, reply) => {
    const body = BeneficiaryCreate.parse(req.body);
    const id = `ben-${randomUUID().slice(0, 8)}`;
    db.prepare("INSERT INTO beneficiaries (id,user_id,name,relation,email) VALUES (?,?,?,?,?)").run(
      id, DEMO_USER_ID, body.name, body.relation, body.email,
    );
    reply.code(201);
    return toBeneficiary(db.prepare("SELECT * FROM beneficiaries WHERE id = ?").get(id));
  });

  app.patch<{ Params: { id: string } }>("/api/legacy/beneficiaries/:id", (req) => {
    const existing = db
      .prepare("SELECT * FROM beneficiaries WHERE user_id = ? AND id = ?")
      .get(DEMO_USER_ID, req.params.id);
    if (!existing) throw notFound("Begünstigte:r");
    const merged = { ...toBeneficiary(existing), ...BeneficiaryUpdate.parse(req.body) };
    db.prepare("UPDATE beneficiaries SET name=?,relation=?,email=? WHERE id=? AND user_id=?").run(
      merged.name, merged.relation, merged.email, req.params.id, DEMO_USER_ID,
    );
    return toBeneficiary(db.prepare("SELECT * FROM beneficiaries WHERE id = ?").get(req.params.id));
  });

  app.delete<{ Params: { id: string } }>("/api/legacy/beneficiaries/:id", (req) => {
    const res = db
      .prepare("DELETE FROM beneficiaries WHERE user_id = ? AND id = ?")
      .run(DEMO_USER_ID, req.params.id);
    if (res.changes === 0) throw notFound("Begünstigte:r");
    // Verweise in Assets lösen.
    db.prepare("UPDATE legacy_assets SET beneficiary_id = NULL WHERE beneficiary_id = ?").run(req.params.id);
    return { ok: true };
  });
}
