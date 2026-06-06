# RushHour

**KI-Matching für lokale Marken und Content-Creators.** Airbnb trifft LinkedIn für Creator-Kollaborationen — optimiert auf erfolgreiche Partnerschaften statt endloses Durchblättern.

🔗 **Live-Demo:** https://rush-hour-two.vercel.app

> Hackathon-Projekt (AI BEAVERS × Mollie Founder Hackathon).

---

## Das Problem

Lokale Geschäfte verbrennen Zeit und Budget, um Creator manuell auf Instagram, TikTok und über Agenturen zu finden. Creator wiederum kämpfen mit Akquise, Sichtbarkeit und Outreach.

**Kernidee:** Die KI sagt voraus, welche Geschäft-Creator-Kombination wirklich funktioniert — statt nur einen Katalog zum Durchscrollen zu liefern. Der „Moneyball"-Effekt: ein kleiner, hyperlokaler Creator mit echtem Engagement schlägt für ein Nachbarschafts-Ziel den Account mit 200k bundesweiten Followern.

## Wie es funktioniert

```
Website-URL ──► extract-business ──► fetch HTML + GPT ──► Brand-Profil ──► Supabase
Creator-Link ─► extract-creator ──► fetch + GPT (Bio/Posts) ─► Profil ──► Supabase
Ziel ────────► match ──► goalToWeights (KI/Preset) ──► alle Creator aus Supabase ──► Ranking
Auswahl ─────► report ──► GPT ──► konkrete Begründung (3 Stichpunkte)
```

Das Prinzip: **Extraktion und Begründung laufen über echtes GPT, das Scoring ist deterministische Mathematik, die Daten liegen in Supabase.**

- **Goal → Weights:** Ein Marketing-Ziel wird in vier Gewichte übersetzt — `localAudience`, `engagement`, `styleMatch`, `reach` (Presets sofort, Freitext via GPT).
- **Scoring:** Gewichtete Summe über vier Features pro Creator (lokaler Anteil mit Stadt-Bonus, Engagement, Jaccard-Stil-Match, Reichweite), normiert auf 0–100 mit Ampel (grün ≥75, gelb ≥50, sonst rot).
- **Wachsender Pool:** Jeder neu extrahierte Creator wird gespeichert und vergrößert die Match-Basis.

## Tech-Stack

- **Next.js 16** (App Router, Turbopack) · **React 19** · **TypeScript**
- **Tailwind CSS v4**
- **OpenAI** (`gpt-4o-mini`) — Extraktion, Ziel-Gewichtung, Report
- **Supabase** (Postgres) — Persistenz für Geschäfte und Creator
- **Vercel** — Hosting (Root Directory = `app-rushhour`)

## Projektstruktur

```
app-rushhour/
├─ app/
│  ├─ page.tsx                 # Business-Flow: URL → Ziel-Chat → Ergebnisse
│  ├─ creator/                 # Creator-Onboarding
│  └─ api/
│     ├─ extract-business/     # Website → Brand-Profil (fetch + GPT) + speichern
│     ├─ extract-creator/      # Profil-Link → Creator-Profil (fetch + GPT) + speichern
│     ├─ match/                # Ziel → Gewichte → Ranking über Supabase-Pool
│     └─ report/               # GPT-Begründung für einen Match
├─ lib/
│  ├─ types.ts                 # Shared Contract (Frontend ↔ Backend)
│  ├─ matcher.ts               # Deterministisches Scoring
│  ├─ llm.ts                   # OpenAI: goalToWeights + generateReport
│  ├─ extract.ts               # Fetch + GPT-Extraktion (mit Fallbacks)
│  ├─ supabase.ts / db.ts      # Supabase-Client + Row↔Type-Mapper
│  ├─ mock-mode.ts             # Laufzeit-Schalter Mock/Real
│  └─ fixtures/                # Beispiel-Daten + Seed-Quelle
└─ supabase/schema.sql         # DB-Schema + 4 Seed-Creator
```

## Lokales Setup

```bash
cd app-rushhour
npm install
```

`.env.local` anlegen:

```
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
# Optional: Standard-Modus der UI (true = Mock). Sonst startet die App im Real-Modus.
# NEXT_PUBLIC_USE_MOCK=true
```

Datenbank einrichten: `supabase/schema.sql` einmal im Supabase-SQL-Editor ausführen (legt die Tabellen `businesses` und `creators` an und seedet vier Demo-Creator).

Starten:

```bash
npm run dev      # http://localhost:3000
npm run build    # Production-Build
```

## Mock- / Real-Modus

Oben rechts in der Navigation gibt es einen **Live-Toggle**:

- **Real** (Standard): echte Extraktion + Supabase + OpenAI.
- **Mock**: lokale Beispieldaten, kein Netz — robust für Offline-Demos.

Der Modus wird zur Laufzeit umgeschaltet (kein Neustart) und in `localStorage` gemerkt. Der Default kommt aus `NEXT_PUBLIC_USE_MOCK`.

## Deployment (Vercel)

- **Root Directory:** `app-rushhour`
- **Framework:** Next.js
- **Env-Variablen:** `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- Pushes auf `main` deployen automatisch.

## Hinweise

- Restaurant-Websites werden zuverlässig real extrahiert (statisches HTML). Creator-Zahlen sind teils **geschätzt**, da Instagram/TikTok das Scrapen blockieren — ein späterer Ausbau wäre eine offizielle Datenquelle/API.
- Geheime Keys (`SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`) bleiben serverseitig und sind nie im Client-Bundle.
