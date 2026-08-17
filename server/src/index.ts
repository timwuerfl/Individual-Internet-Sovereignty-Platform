import { buildApp } from "./app.js";
import { getDb } from "./db.js";
import { seed } from "./seed.js";

const PORT = Number(process.env.PORT ?? 3001);

const db = getDb();

// Erst-Seed, falls die DB leer ist (bequemer Start ohne separaten Seed-Lauf).
const count = db.prepare("SELECT COUNT(*) c FROM users").get() as { c: number };
if (count.c === 0) {
  seed(db);
  console.log("• Leere DB erkannt — Seed eingespielt.");
}

const app = buildApp(db);
app
  .listen({ port: PORT, host: "127.0.0.1" })
  .then(() => console.log(`✓ API läuft auf http://127.0.0.1:${PORT}/api`))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
