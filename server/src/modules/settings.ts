import type { FastifyInstance } from "fastify";
import { SettingsUpdate, type Settings, type Verification } from "@icp/shared";
import type { DB } from "../db.js";
import { DEMO_USER_ID } from "../db.js";

export function registerSettings(app: FastifyInstance, db: DB) {
  const get = <T>(key: string, fallback: T): T => {
    const row = db
      .prepare("SELECT value FROM settings WHERE user_id = ? AND key = ?")
      .get(DEMO_USER_ID, key) as { value: string } | undefined;
    return row ? (JSON.parse(row.value) as T) : fallback;
  };
  const set = (key: string, value: unknown) =>
    db
      .prepare(
        `INSERT INTO settings (user_id,key,value) VALUES (?,?,?)
         ON CONFLICT(user_id,key) DO UPDATE SET value = excluded.value`,
      )
      .run(DEMO_USER_ID, key, JSON.stringify(value));

  const read = (): Settings => ({
    toggles: get<Record<string, boolean>>("toggles", {}),
    scanFrequency: get<string>("scanFrequency", "daily"),
    verifications: get<Verification[]>("verifications", []),
  });

  app.get("/api/settings", () => read());

  app.patch("/api/settings", (req) => {
    const patch = SettingsUpdate.parse(req.body);
    if (patch.toggles) set("toggles", { ...get("toggles", {}), ...patch.toggles });
    if (patch.scanFrequency) set("scanFrequency", patch.scanFrequency);
    return read();
  });
}
