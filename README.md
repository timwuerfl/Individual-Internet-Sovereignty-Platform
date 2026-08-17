# Identity Control Plane — Frontend-Prototyp

> **„You own your digital identity.“**
> Eine zentrale Steuerebene zwischen Nutzer und Internet, die die Komplexität der
> eigenen digitalen Identität sichtbar, verständlich und steuerbar macht.

Dies ist ein **Prototyp für Nutzer-Feedback und Pitch-Demos** — kein
Produktivsystem. Das Repo ist ein npm-Workspace-Monorepo und liefert **zwei
parallel lauffähige Varianten** derselben Oberfläche:

| Variante | Port | Daten | Workspace |
|----------|------|-------|-----------|
| **Backend-Version** | `http://localhost:5173` | echtes Backend (Fastify + SQLite), Dashboard/Inventar/Wahrnehmung über `/api` | [`web/`](web/) + [`server/`](server/) |
| **Standalone („Zwischenschritt")** | `http://localhost:5174` | komplett ohne Backend — alle Daten als In-Memory-Mock | [`web-standalone/`](web-standalone/) |

Die Standalone ist eine **Kopie des Frontends vor der Backend-Integration**:
identische UI, aber der REST-Client in
[`web-standalone/src/lib/api.ts`](web-standalone/src/lib/api.ts) liefert die
Daten lokal aus dem Speicher (gleicher Datensatz und gleiche Ableitungen wie der
Server-Seed, damit beide Varianten dasselbe Bild zeigen).

---

## Setup

```bash
npm install
npm run dev        # startet ALLES: API (3001) + Backend-Web (5173) + Standalone (5174)
```

Gezielt einzelne Teile:

```bash
npm run dev:backend     # nur API (3001) + Backend-Web (5173)
npm run dev:standalone  # nur Standalone-Mock (5174) — kein Backend nötig
npm run dev:api         # nur die API (3001)
```

Weitere Skripte:

```bash
npm run build      # Produktions-Build beider Frontends (web + web-standalone)
npm run typecheck  # Typprüfung über alle Workspaces (server, web, web-standalone)
npm run test       # Server-Tests (vitest)
npm run seed       # SQLite-DB auf den Seed-Stand zurücksetzen
```

Die SQLite-DB der Backend-Version wird beim ersten Start automatisch geseedet
(falls leer); per `npm run seed` oder `POST /api/dev/reset` zurücksetzbar.

**Stack:** React 18 · Vite · TypeScript · React Router 6 · Tailwind CSS 3 ·
lucide-react · Fontsource (Fraunces + IBM Plex Sans) · TanStack Query.
Backend: Fastify 5 · better-sqlite3 · zod (geteilte Schemas in
[`shared/`](shared/) als Single Source of Truth für FE↔BE-Verträge).

---

## Externe Scans: Leaks & Monitoring (optional, mit API-Keys)

Die Backend-Version kann echte externe Dienste abfragen. **Ohne Keys läuft alles
im Mock-Modus** (deterministische Demo-Daten, Antwort enthält `"mock": true`);
sobald ein Key in `server/.env` steht, schaltet das jeweilige Feature auf echte
Abfragen um. Setup:

```bash
cp server/.env.example server/.env   # dann Keys eintragen
```

| Variable | Dienst | wofür | bezogen über |
|----------|--------|-------|--------------|
| `HIBP_API_KEY` | HaveIBeenPwned | Daten-Leak-Scan einer E-Mail | https://haveibeenpwned.com/API/Key (kostenpflichtig) |
| `SERPAPI_KEY` | SerpAPI | Reverse-Image (Google Lens) + Namens-/Postings-Suche | https://serpapi.com (Free-Tier: 100/Monat) |

Externe Antworten werden in der Tabelle `external_cache` mit TTL gecacht
(`EXTERNAL_CACHE_TTL_H`, Standard 24 h), um bezahlte Quota zu schonen.

**Profil / „Meine Identität"** (Seite `/profile`, voll verdrahtet) ist die
Datenbasis für beide Scans: hier pflegt man Namen, alternative Schreibweisen,
E-Mails und eigene Konten (Dienst, Handle, URL, E-Mail — **ohne Passwörter**).
- `GET /api/profile` · `PATCH /api/profile` `{ name?, aliases?, extraEmails? }`
- `POST|PATCH|DELETE /api/profile/accounts[/:id]`
- `GET /api/profile/search-terms` — Name + Aliasse + Handles für den Fake-Scan
Zwei Aktionen auf der Seite: **„Auf Leaks prüfen"** (prüft alle hinterlegten
E-Mails) und **„Nach Fake-Profilen suchen"** (sucht über Name/Aliasse/Handles).

**Feature A — Leak-Scan** (→ schreibt `findings` der Kategorie `leak`, fließt in
Score + Dashboard; Seite `/leaks` zeigt Ergebnisse + „Jetzt prüfen"-Button):
- `POST /api/leaks/scan` `{ "email"?: string }` — **ohne `email` werden ALLE Profil-E-Mails** geprüft (Treffer dedupliziert)
- `GET /api/leaks` — alle Leak-Fundstellen + Zeitpunkt des letzten Scans

**Feature B — Fake-Account-/Bild-Monitoring** (→ Tabelle `detections`,
hochkonfidente Bild-Treffer erzeugen ein Dashboard-Ereignis). In der
Backend-Version ist die Seite **`/monitoring` voll verdrahtet**: Suchformular
(Bild-URL + Name), Live-Trefferliste mit Status-Aktionen, und **Abgleich gegen
bekannte eigene Konten** — Treffer, die einem Inventar-Account entsprechen,
werden als `isKnown` markiert und aus der Fake-Liste herausgerechnet.
- `POST /api/monitoring/scan` `{ "imageUrl"?: string, "name"?: string }` — ohne Angabe: Namens-Scan des Demo-Nutzers
- `GET /api/monitoring` — Treffer-Feed + Status-Übersicht (inkl. `known`-Zähler)
- `PATCH /api/monitoring/:id` `{ "status": "new|reviewed|takedown_requested|dismissed" }`

Der Eigen-Konto-Abgleich nutzt die im Profil hinterlegten Konten (URL **und**
Plattform+Handle) sowie die URLs der Inventar-Fundstellen (Kategorie `account`).
Damit speisen sich Leak- und Fake-Account-Suche beide aus Name + allen
Account-Daten. Die **Standalone-Version (5174)** behält ihre Mock-Seiten — sie
hat kein Backend.

> Hinweis: Eine *echte* Reverse-Image-Suche („wo taucht dieses Foto auf?") gibt es
> in der offiziellen Google-API nicht — daher SerpAPI (Google-Lens-Endpoint).
> `POST /api/dev/reset` setzt die DB inkl. Seed-Treffern zurück.

---

## Module: voll funktional (A) vs. UI-only (B)

Der Prototyp trennt bewusst zwischen interaktiven Modulen mit Mock-Daten und
reinen Interface-Vorschauen für Funktionen, die ein echtes Backend / ML /
Rechtsprozesse bräuchten. UI-only-Module sind in der Navigation mit **„Soon“**
markiert und tragen oben einen dezenten Hinweis („Vorschau · Backend in
Entwicklung“). Deaktivierte Aktionen sind mit einem **„Demo“**-Marker versehen.

| # | Modul | Route | Typ | Status |
|---|-------|-------|-----|--------|
| 1 | **Übersicht** (Dashboard) | `/` | **A** | Score, Ereignisse, Modul-Status, Quick-Stats |
| 2 | **Identitäts-Inventar** | `/inventory` | **A** | Such-/Filter-Liste, Risiko-Sortierung, Detail-Drawer |
| 3 | **Wahrnehmung** (Reputation) | `/reputation` | **A** | Perspektiven-Umschalter + Einschätzung & Empfehlungen |
| 4 | **Digitaler Nachlass** | `/legacy` | **A** | Asset-Inventar, Begünstigte, editierbare Anweisungen (lokaler State) |
| 5 | **Einstellungen** | `/settings` | **A** | Verifizierungs-Status, Datenhaltung, Toggles (lokaler State) |
| 6 | **Datenrechte** (DSGVO) | `/data-rights` | **B** | Fall-Pipeline (Auskunft→Widerspruch→Löschung→Beschwerde) + Timeline |
| 7 | **Deepfake-Monitoring** | `/monitoring` | **B** | Treffer-Feed, Konfidenz, Referenz-Abgleich, Takedown (Demo) |
| 8 | **Agenten-Monitoring** | `/agents` | **B** | Agenten-Registry, Scopes, Audit-Log, Anomalien, Kill-Switch (Demo) |

**(A) Voll interaktiv:** Navigation, Filter, Suche, Detailansichten und Formulare
funktionieren mit Mock-Daten und lokalem State. Änderungen am digitalen Nachlass
und an den Einstellungen werden im laufenden Tab gehalten (kein Persist).

**(B) UI-only:** realistische Platzhalter-Daten, vollständiges Interface,
**deaktivierte Aktionen**. Es werden keine echten Scans, Rechtsanfragen oder
Deepfake-Analysen ausgeführt.

Lebendige Demo-Zustände sind eingebaut: Lade-Skeletons (Inventar), Leerzustände
(gefilterte Suche), und mehrere „Achtung“-Zustände (kritischer Leak, Deepfake-
Treffer, Agenten-Anomalie).

---

## Projektstruktur

```
src/
  main.tsx                # Entry
  router.tsx              # Routen → Seiten
  index.css               # Font-Imports + CSS-Variablen-Spiegel der Tokens
  lib/
    types.ts              # Domänen-Typen
    nav.ts                # zentrale Navigations-Registry (Sidebar + Dashboard + Router)
    format.ts             # Datums-/Zahlen-Helfer (de-DE), cn()
    useFakeLoading.ts     # simuliert Laden für Skeletons
  components/
    ui/                   # Design-System: Button, Card, Badge, StatusPill,
                          #   Drawer, Table, EmptyState, Skeleton, Toggle,
                          #   SegmentedControl, Field/Input/Select/Textarea
    common/               # ScoreArc, risk-Helfer, DemoNotice
    layout/               # AppLayout, Sidebar, PageHeader
  pages/                  # eine Datei pro Modul
  mock/                   # statische Mock-Daten (eine Datei pro Modul)
tailwind.config.js        # ← zentrales Design-Token-File (Farben, Typo, Spacing)
```

### Design-System / Tokens

Single source of truth: **[`tailwind.config.js`](tailwind.config.js)** (ausführlich
kommentiert), gespiegelt als CSS-Variablen in
[`src/index.css`](src/index.css) für SVG-/Raw-CSS-Kontexte.

Design-Direktion: editorial, nahezu monochrom, vertrauenswürdig. Struktur über
1px-Hairlines + Whitespace statt Schatten. Typo-Pairing **Fraunces** (Serifen-
Headlines) + **IBM Plex Sans** (UI). Eine ruhige Akzentfarbe (gedämpftes
Tannengrün); Farbe ausschließlich funktional (Status), nie dekorativ.
Line-Icons (Lucide), subtile Transitions, reduzierte Datenvisualisierung.

---

## Wo das Backend später andockt

Anbindungspunkte sind im Code mit `// TODO: backend` markiert. Die wichtigsten:

- **Datenbeschaffung:** `useFakeLoading` ersetzen durch echtes Fetching
  (z. B. React Query / Router-Loader). Mock-Importe in `src/mock/` durch
  API-Antworten ersetzen — die Typen in `lib/types.ts` definieren den Vertrag.
- **Inventory (Modul 2):** Discovery-Engine (Account-Verknüpfung, Broker-Abgleich,
  Breach-Monitoring, Suchmaschinen-Crawling) füllt `InventoryItem[]`.
- **Reputation (Modul 3):** modellgestützte Aufbereitung der Perspektiven aus
  aggregierten Signalen.
- **Nachlass (Modul 4) & Einstellungen (Modul 5):** verschlüsselte Persistenz,
  Schlüsselverwaltung, eID-/Verifizierungs-Flows; lokaler State → API-Mutationen.
- **Datenrechte (Modul 6):** Versand von Auskunfts-/Widerspruchs-/Lösch-Anträgen,
  Fristen-Tracking, Eskalation an Aufsichtsbehörden.
- **Deepfake-Monitoring (Modul 7):** Crawler + Bild-/Stimm-Embeddings +
  Konfidenz-Modell; Takedown-Versand mit Identitätsnachweis aus dem verifizierten Kern.
- **Agenten-Monitoring (Modul 8):** OAuth-Scopes, signierte Audit-Logs,
  Anomalie-Erkennung, echter Kill-Switch.

Aktuell rein illustrative Aktionen (`disabled`) müssen mit echten Mutationen +
Bestätigungs-Flows verkabelt werden.
