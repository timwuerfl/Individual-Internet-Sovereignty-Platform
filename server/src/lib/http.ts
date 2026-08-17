// Schlanker HTTP-Helfer für externe Dienste: Timeout + einheitliches Fehler-Mapping.
// Nutzt das globale fetch (Node ≥ 18). Status-Codes mit Bedeutung (z. B. 404 bei
// HIBP) wertet der Aufrufer selbst aus — deshalb wird die rohe Response zurückgegeben.
import { ApiErr } from "./errors.js";
import { config } from "./config.js";

export interface HttpOptions {
  headers?: Record<string, string>;
  timeoutMs?: number;
}

export async function httpGet(url: string, opts: HttpOptions = {}): Promise<Response> {
  const { headers = {}, timeoutMs = 10_000 } = opts;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, {
      method: "GET",
      signal: ctrl.signal,
      headers: { "user-agent": config.userAgent, accept: "application/json", ...headers },
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : "unbekannt";
    throw new ApiErr(502, "upstream_unreachable", `Externer Dienst nicht erreichbar: ${reason}`);
  } finally {
    clearTimeout(timer);
  }
}
