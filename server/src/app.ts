import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { ZodError } from "zod";
import type { DB } from "./db.js";
import { ApiErr } from "./lib/errors.js";
import { registerFindings } from "./modules/findings.js";
import { registerLeaks } from "./modules/leaks.js";
import { registerMonitoring } from "./modules/monitoring.js";
import { registerProfile } from "./modules/profile.js";
import { registerDashboard } from "./modules/dashboard.js";
import { registerReputation } from "./modules/reputation.js";
import { registerLegacy } from "./modules/legacy.js";
import { registerSettings } from "./modules/settings.js";
import { registerAgents } from "./modules/agents.js";
import { registerDev } from "./modules/dev.js";

export function buildApp(db: DB): FastifyInstance {
  const app = Fastify({ logger: false });
  app.register(cors, { origin: true });

  // Einheitliches Fehlerformat (siehe @icp/shared ApiError).
  app.setErrorHandler((err, _req, reply) => {
    if (err instanceof ZodError) {
      reply.code(400).send({
        error: { code: "validation_error", message: "Ungültige Eingabe", details: err.flatten() },
      });
      return;
    }
    if (err instanceof ApiErr) {
      reply.code(err.statusCode).send({
        error: { code: err.code, message: err.message, details: err.details },
      });
      return;
    }
    const message = err instanceof Error ? err.message : "Interner Fehler";
    reply.code(500).send({ error: { code: "internal", message } });
  });

  app.setNotFoundHandler((req, reply) => {
    reply.code(404).send({ error: { code: "not_found", message: `Route ${req.url} nicht gefunden` } });
  });

  registerDev(app, db);
  registerDashboard(app, db);
  registerFindings(app, db);
  registerLeaks(app, db);
  registerMonitoring(app, db);
  registerProfile(app, db);
  registerReputation(app, db);
  registerLegacy(app, db);
  registerSettings(app, db);
  registerAgents(app, db);

  return app;
}
