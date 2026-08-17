import { describe, it, expect, beforeAll } from "vitest";
import { openDb, initSchema, type DB } from "./db.js";
import { seed } from "./seed.js";
import { buildApp } from "./app.js";
import { exposureScore } from "./lib/score.js";
import type { IdentityFinding } from "@icp/shared";

let db: DB;
let app: ReturnType<typeof buildApp>;

beforeAll(async () => {
  db = openDb(":memory:");
  initSchema(db);
  seed(db);
  app = buildApp(db);
  await app.ready();
});

describe("Seed", () => {
  it("lädt die Findings", async () => {
    const res = await app.inject({ method: "GET", url: "/api/findings" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.total).toBe(13);
    expect(body.items.length).toBe(13);
    // nach Risiko sortiert → erster Eintrag ist kritisch
    expect(body.items[0].risk).toBe("critical");
  });

  it("filtert serverseitig nach Kategorie", async () => {
    const res = await app.inject({ method: "GET", url: "/api/findings?category=leak" });
    expect(res.json().total).toBe(3);
  });
});

describe("Exposure-Score", () => {
  it("berechnet deterministisch", () => {
    const findings: IdentityFinding[] = [
      { id: "a", title: "", category: "leak", source: "", sensitivity: 1, risk: "critical", exposedData: [], discovered: "", lastSeen: "", status: "active", description: "", actions: [] },
      { id: "b", title: "", category: "account", source: "", sensitivity: 0, risk: "low", exposedData: [], discovered: "", lastSeen: "", status: "removed", description: "", actions: [] },
    ];
    // a: 1.0 × 1.0 × 1.0 × (0.5+0.5) = 1.0 ; b: status removed → 0 ; raw=1.0
    // score = round(1.0 / 7.5 × 100) = 13
    expect(exposureScore(findings)).toBe(13);
  });

  it("ignoriert entfernte Fundstellen", () => {
    const removed: IdentityFinding[] = [
      { id: "x", title: "", category: "leak", source: "", sensitivity: 1, risk: "critical", exposedData: [], discovered: "", lastSeen: "", status: "removed", description: "", actions: [] },
    ];
    expect(exposureScore(removed)).toBe(0);
  });
});

describe("Legacy CRUD", () => {
  it("durchläuft create → read → update → delete", async () => {
    const created = await app.inject({
      method: "POST",
      url: "/api/legacy/assets",
      payload: { account: "Testkonto", type: "cloud", value: "x", directive: "undecided", beneficiaryId: null, notes: "" },
    });
    expect(created.statusCode).toBe(201);
    const id = created.json().id as string;

    const list = await app.inject({ method: "GET", url: "/api/legacy" });
    expect(list.json().assets.some((a: { id: string }) => a.id === id)).toBe(true);

    const patched = await app.inject({
      method: "PATCH",
      url: `/api/legacy/assets/${id}`,
      payload: { directive: "delete" },
    });
    expect(patched.json().directive).toBe("delete");

    const del = await app.inject({ method: "DELETE", url: `/api/legacy/assets/${id}` });
    expect(del.statusCode).toBe(200);

    const after = await app.inject({ method: "GET", url: "/api/legacy" });
    expect(after.json().assets.some((a: { id: string }) => a.id === id)).toBe(false);
  });

  it("validiert ungültige Eingaben (400)", async () => {
    const res = await app.inject({ method: "POST", url: "/api/legacy/assets", payload: { account: "nur das" } });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe("validation_error");
  });
});

describe("Leak-Scan (HIBP, Mock-Modus)", () => {
  it("legt Leak-Fundstellen an und meldet mock=true ohne Key", async () => {
    const before = await app.inject({ method: "GET", url: "/api/leaks" });
    const beforeCount = before.json().items.length;

    const scan = await app.inject({ method: "POST", url: "/api/leaks/scan", payload: {} });
    expect(scan.statusCode).toBe(200);
    const body = scan.json();
    expect(body.mock).toBe(true);
    expect(body.total).toBeGreaterThan(0);
    expect(body.created).toBeGreaterThan(0);

    const after = await app.inject({ method: "GET", url: "/api/leaks" });
    expect(after.json().items.length).toBe(beforeCount + body.created);
    expect(after.json().lastScan).toBeTruthy();
  });

  it("ist idempotent — zweiter Scan legt nichts Neues an", async () => {
    const first = await app.inject({ method: "POST", url: "/api/leaks/scan", payload: {} });
    const second = await app.inject({ method: "POST", url: "/api/leaks/scan", payload: {} });
    expect(second.json().created).toBe(0);
    expect(second.json().total).toBe(first.json().total);
  });

  it("weist ungültige E-Mail ab (400)", async () => {
    const res = await app.inject({ method: "POST", url: "/api/leaks/scan", payload: { email: "keine-mail" } });
    expect(res.statusCode).toBe(400);
  });
});

describe("Monitoring (SerpAPI, Mock-Modus)", () => {
  it("liefert die geseedeten Treffer", async () => {
    const res = await app.inject({ method: "GET", url: "/api/monitoring" });
    expect(res.statusCode).toBe(200);
    expect(res.json().items.length).toBe(4);
    expect(res.json().summary.total).toBe(4);
  });

  it("rechnet bekannte eigene Konten heraus (isKnown)", async () => {
    const res = await app.inject({ method: "GET", url: "/api/monitoring" });
    const body = res.json();
    // Das geseedete LinkedIn-Profil deckt sich mit der Inventar-Fundstelle.
    expect(body.summary.known).toBe(1);
    const own = body.items.find((d: { url: string }) => d.url.includes("linkedin.com/in/lena-kessler"));
    expect(own.isKnown).toBe(true);
    // Fake-Profile bleiben isKnown=false.
    const fake = body.items.find((d: { url: string }) => d.url.includes("lena.kesssler_"));
    expect(fake.isKnown).toBe(false);
  });

  it("scant per Name (Default) und legt Treffer an, mock=true", async () => {
    const scan = await app.inject({ method: "POST", url: "/api/monitoring/scan", payload: {} });
    expect(scan.statusCode).toBe(200);
    expect(scan.json().mock).toBe(true);
    expect(scan.json().mode).toBe("name");
    expect(scan.json().created).toBeGreaterThan(0);
  });

  it("scant per Bild + Name → mode=both, idempotenter Re-Scan", async () => {
    const first = await app.inject({
      method: "POST",
      url: "/api/monitoring/scan",
      payload: { imageUrl: "https://example.com/foto.jpg", name: "Lena Kessler" },
    });
    expect(first.json().mode).toBe("both");
    expect(first.json().created).toBeGreaterThan(0);
    const second = await app.inject({
      method: "POST",
      url: "/api/monitoring/scan",
      payload: { imageUrl: "https://example.com/foto.jpg", name: "Lena Kessler" },
    });
    expect(second.json().created).toBe(0);
  });

  it("aktualisiert den Treffer-Status", async () => {
    const list = await app.inject({ method: "GET", url: "/api/monitoring" });
    const id = list.json().items[0].id as string;
    const patched = await app.inject({
      method: "PATCH",
      url: `/api/monitoring/${id}`,
      payload: { status: "takedown_requested" },
    });
    expect(patched.statusCode).toBe(200);
    expect(patched.json().status).toBe("takedown_requested");
  });
});

describe("Profil & Identität", () => {
  it("liefert eigene Konten + berechnete E-Mail-Vereinigung", async () => {
    const res = await app.inject({ method: "GET", url: "/api/profile" });
    expect(res.statusCode).toBe(200);
    const p = res.json();
    expect(p.accounts.length).toBe(4);
    expect(p.emails).toEqual(
      expect.arrayContaining(["lena.kessler@example.de", "lena.kessler@gmail.com", "lena.k.alt@example.de"]),
    );
    expect(p.aliases).toContain("Lena K. Kessler");
  });

  it("CRUD für eigene Konten", async () => {
    const created = await app.inject({
      method: "POST",
      url: "/api/profile/accounts",
      payload: { label: "TikTok", handle: "lenak", url: "https://tiktok.com/@lenak" },
    });
    expect(created.statusCode).toBe(201);
    const id = created.json().id as string;
    const list = await app.inject({ method: "GET", url: "/api/profile" });
    expect(list.json().accounts.some((a: { id: string }) => a.id === id)).toBe(true);
    const del = await app.inject({ method: "DELETE", url: `/api/profile/accounts/${id}` });
    expect(del.statusCode).toBe(200);
  });

  it("Leak-Scan ohne Argument prüft ALLE Identitäts-E-Mails", async () => {
    const res = await app.inject({ method: "POST", url: "/api/leaks/scan", payload: {} });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body.scanned)).toBe(true);
    expect(body.scanned.length).toBeGreaterThan(1); // mehrere E-Mails aus dem Profil
    expect(body.mock).toBe(true);
  });

  it("liefert Suchbegriffe (Name + Aliasse + Handles)", async () => {
    const res = await app.inject({ method: "GET", url: "/api/profile/search-terms" });
    const { terms } = res.json();
    expect(terms).toEqual(expect.arrayContaining(["Lena Kessler", "lena-kessler", "lena.kessler"]));
  });
});

describe("Agenten-Logik", () => {
  it("erkennt Anomalie beim Reise-Planer und leitet Status ab", async () => {
    const res = await app.inject({ method: "GET", url: "/api/agents/ag-travel" });
    const body = res.json();
    expect(body.anomalies).toBeGreaterThan(0);
    expect(body.status).toBe("anomaly");
  });
});
