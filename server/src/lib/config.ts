// Zentrale, validierte Laufzeit-Konfiguration. Lädt `server/.env` (falls vorhanden)
// nativ über Node — KEINE Zusatz-Dependency (process.loadEnvFile, Node ≥ 20.12).
import { z } from "zod";

// Im Testlauf (vitest) NICHT die .env laden — Tests bleiben hermetisch und
// laufen unabhängig von lokal hinterlegten Keys im Mock-Modus.
if (!process.env.VITEST) {
  try {
    // Lädt .env relativ zum Arbeitsverzeichnis des Servers (server/).
    process.loadEnvFile?.();
  } catch {
    // Keine .env vorhanden → externe Dienste laufen im Mock-Modus.
  }
}

// Leere Strings (z. B. `HIBP_API_KEY=` in der .env) als „nicht gesetzt" behandeln.
const optKey = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.string().min(1).optional(),
);

const Env = z.object({
  HIBP_API_KEY: optKey,
  SERPAPI_KEY: optKey,
  EXTERNAL_CACHE_TTL_H: z.coerce.number().positive().default(24),
});

const parsed = Env.parse(process.env);

export const config = {
  hibp: { key: parsed.HIBP_API_KEY, enabled: Boolean(parsed.HIBP_API_KEY) },
  serpapi: { key: parsed.SERPAPI_KEY, enabled: Boolean(parsed.SERPAPI_KEY) },
  cacheTtlMs: parsed.EXTERNAL_CACHE_TTL_H * 3_600_000,
  // HIBP verlangt einen aussagekräftigen User-Agent.
  userAgent: "ICP-Prototype (sovereign-identity-tool)",
};
