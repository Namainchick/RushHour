# RushHour Backend — Implementation Plan (Agent B)

> **For agentic workers:** Implement this plan task by task. Steps use checkbox (`- [ ]`) syntax for tracking. This is a hackathon proof-of-concept: data is mocked, but the *logic* (goal→weights, scoring, reasons) runs for real. There are no unit-test cycles — each task ends with a concrete "run this, see this" check.

**Goal:** Build four API routes that turn a business + a goal into a ranked, explained list of creators. The data is faked; the goal-understanding and the reasoning use real OpenAI calls; the scoring is deterministic code.

**Architecture:** Next.js App Router API routes call three lib modules — `matcher.ts` (deterministic weighted-sum scoring), `llm.ts` (OpenAI: goal→weights and reason bullets), and `fixtures/` (prepared creator/business JSON). The frontend never sees the OpenAI key.

**Tech Stack:** Next.js route handlers, TypeScript, `openai` npm package, JSON fixtures.

**Prerequisite:** `00-setup.md` has been run. `lib/types.ts` and `.env.local` already exist. **Do not edit `lib/types.ts`.** You own only `app/api/`, `lib/matcher.ts`, `lib/llm.ts`, `lib/fixtures/`.

**Contract you must honor** (from `lib/types.ts`, read-only):

```ts
type BusinessProfile = { id; name; category; city; neighborhood?; styleTags: string[]; description };
type CreatorSignals  = { localShare: number; engagement: number; reach: number }; // each 0..1
type CreatorProfile  = { id; handle; platform; followers; avatarUrl; topics: string[]; styleTags: string[]; audienceCity; engagementRate; signals: CreatorSignals };
type Weights         = { localAudience; engagement; styleMatch; reach }; // each 0..1
type FeatureContribution = { key: keyof Weights; label: string; value: number; weight: number };
type MatchResult     = { creator: CreatorProfile; score: number; light: "green"|"yellow"|"red"; shortReason: string; contributions: FeatureContribution[] };
type MatchResponse   = { weights: Weights; results: MatchResult[] };
```

Endpoints to build: `POST /api/extract-business`, `POST /api/extract-creator`, `POST /api/match`, `POST /api/report`.

---

### Task 1: Fixtures — prepared creators and businesses

**Files:**
- Create: `lib/fixtures/creators.json`
- Create: `lib/fixtures/businesses.json`

- [ ] **Step 1: Create `lib/fixtures/businesses.json`** — one starter business.

```json
[
  {
    "id": "biz_trattoria",
    "name": "Trattoria Bella",
    "category": "Italienisches Restaurant",
    "city": "Hamburg",
    "neighborhood": "Eppendorf",
    "styleTags": ["warm", "rustikal", "familiär", "authentisch"],
    "description": "Familiengeführtes italienisches Restaurant in Hamburg-Eppendorf mit warmem, rustikalem Ambiente und hausgemachter Pasta."
  }
]
```

- [ ] **Step 2: Create `lib/fixtures/creators.json`** — four starter creators. Note the deliberate Moneyball setup: `lisa` is small but highly local + high engagement; `foodie_germany` is huge but national.

```json
[
  {
    "id": "cr_lisa",
    "handle": "@lisa_hamburg_eats",
    "platform": "instagram",
    "followers": 8400,
    "avatarUrl": "https://i.pravatar.cc/150?img=47",
    "topics": ["food", "local", "lifestyle"],
    "styleTags": ["warm", "authentisch", "cozy"],
    "audienceCity": "Hamburg",
    "engagementRate": 0.082,
    "signals": { "localShare": 0.71, "engagement": 0.9, "reach": 0.25 }
  },
  {
    "id": "cr_foodie_de",
    "handle": "@foodie_germany",
    "platform": "instagram",
    "followers": 210000,
    "avatarUrl": "https://i.pravatar.cc/150?img=12",
    "topics": ["food", "travel", "restaurants"],
    "styleTags": ["clean", "modern", "glossy"],
    "audienceCity": "Berlin",
    "engagementRate": 0.018,
    "signals": { "localShare": 0.08, "engagement": 0.4, "reach": 0.95 }
  },
  {
    "id": "cr_max",
    "handle": "@max_hh_lifestyle",
    "platform": "tiktok",
    "followers": 32000,
    "avatarUrl": "https://i.pravatar.cc/150?img=33",
    "topics": ["lifestyle", "city", "food"],
    "styleTags": ["modern", "energetisch", "urban"],
    "audienceCity": "Hamburg",
    "engagementRate": 0.054,
    "signals": { "localShare": 0.55, "engagement": 0.7, "reach": 0.55 }
  },
  {
    "id": "cr_pasta_queen",
    "handle": "@pasta.queen",
    "platform": "instagram",
    "followers": 95000,
    "avatarUrl": "https://i.pravatar.cc/150?img=20",
    "topics": ["food", "recipes", "italian"],
    "styleTags": ["warm", "rustikal", "authentisch"],
    "audienceCity": "München",
    "engagementRate": 0.031,
    "signals": { "localShare": 0.12, "engagement": 0.55, "reach": 0.8 }
  }
]
```

- [ ] **Step 3: Verify the JSON is valid.**

Run: `node -e "console.log(require('./lib/fixtures/creators.json').length, require('./lib/fixtures/businesses.json').length)"`
Expected: prints `4 1`.

---

### Task 2: The matcher — deterministic scoring

**Files:**
- Create: `lib/matcher.ts`

- [ ] **Step 1: Write `lib/matcher.ts`** with the full content below.

```ts
import {
  BusinessProfile, CreatorProfile, Weights, MatchResult,
  FeatureContribution, TrafficLight,
} from "./types";

function jaccard(a: string[], b: string[]): number {
  const A = new Set(a.map((s) => s.toLowerCase()));
  const B = new Set(b.map((s) => s.toLowerCase()));
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  const union = new Set([...A, ...B]).size;
  return inter / union;
}

const LABELS: Record<keyof Weights, string> = {
  localAudience: "Lokale Zielgruppe",
  engagement: "Echtes Engagement",
  styleMatch: "Stil-Match",
  reach: "Reichweite",
};

const PHRASES: Record<keyof Weights, string> = {
  localAudience: "starke lokale Zielgruppe",
  engagement: "hohes echtes Engagement",
  styleMatch: "passt zum Markenstil",
  reach: "große Reichweite",
};

export function computeFeatures(biz: BusinessProfile, c: CreatorProfile): Record<keyof Weights, number> {
  const sameCity = c.audienceCity.toLowerCase() === biz.city.toLowerCase();
  return {
    localAudience: sameCity ? c.signals.localShare : c.signals.localShare * 0.15,
    engagement: c.signals.engagement,
    styleMatch: jaccard(c.styleTags, biz.styleTags),
    reach: c.signals.reach,
  };
}

function buildShortReason(contribs: FeatureContribution[]): string {
  const ranked = [...contribs].sort((a, b) => b.weight * b.value - a.weight * a.value);
  const top = ranked.slice(0, 2).filter((c) => c.weight * c.value > 0.05);
  if (top.length === 0) return "Solider Allround-Match.";
  const text = top.map((c) => PHRASES[c.key]).join(", ");
  return text.charAt(0).toUpperCase() + text.slice(1) + ".";
}

export function scoreCreator(biz: BusinessProfile, c: CreatorProfile, w: Weights): MatchResult {
  const f = computeFeatures(biz, c);
  const keys = Object.keys(LABELS) as (keyof Weights)[];
  const totalW = keys.reduce((s, k) => s + w[k], 0) || 1;
  const raw = keys.reduce((s, k) => s + w[k] * f[k], 0);
  const score = Math.round((raw / totalW) * 100);
  const light: TrafficLight = score >= 75 ? "green" : score >= 50 ? "yellow" : "red";
  const contributions: FeatureContribution[] = keys.map((k) => ({
    key: k, label: LABELS[k], value: f[k], weight: w[k],
  }));
  return { creator: c, score, light, shortReason: buildShortReason(contributions), contributions };
}

export function rankCreators(biz: BusinessProfile, creators: CreatorProfile[], w: Weights): MatchResult[] {
  return creators.map((c) => scoreCreator(biz, c, w)).sort((a, b) => b.score - a.score);
}
```

- [ ] **Step 2: Sanity-check the scoring math.**

Run:
```bash
node -e "
const { rankCreators } = require('./lib/matcher.ts');
" 2>/dev/null || echo "TS can't run directly — this check happens in Task 4 via the running server instead."
```
Expected: This prints the fallback message (`.ts` can't run under plain node). That is fine — the matcher is verified end-to-end in Task 4.

---

### Task 3: The LLM module — goal→weights and reason bullets

**Files:**
- Create: `lib/llm.ts`

- [ ] **Step 1: Write `lib/llm.ts`** with the full content below.

```ts
import OpenAI from "openai";
import { Weights, BusinessProfile, MatchResult } from "./types";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Fixed weight profiles for the three UI presets (instant, no LLM call).
const PRESET_WEIGHTS: Record<string, Weights> = {
  local_traffic:  { localAudience: 0.9, engagement: 0.8, styleMatch: 0.4, reach: 0.1 },
  city_awareness: { localAudience: 0.2, engagement: 0.5, styleMatch: 0.4, reach: 0.9 },
  premium_image:  { localAudience: 0.3, engagement: 0.6, styleMatch: 0.9, reach: 0.4 },
};

function clamp01(n: unknown): number {
  const v = typeof n === "number" ? n : 0;
  return Math.max(0, Math.min(1, v));
}

function normalizeWeights(raw: any): Weights {
  return {
    localAudience: clamp01(raw?.localAudience),
    engagement: clamp01(raw?.engagement),
    styleMatch: clamp01(raw?.styleMatch),
    reach: clamp01(raw?.reach),
  };
}

const SYSTEM_WEIGHTS = `Du bist die Matching-Engine einer Plattform, die lokale Geschäfte mit Content-Creators verbindet.
Der Nutzer beschreibt sein Marketing-Ziel. Übersetze das Ziel in Gewichte (jeweils 0.0 bis 1.0) für diese vier Signale:
- localAudience: wie wichtig ist eine Zielgruppe, die lokal in der Nähe des Geschäfts wohnt.
- engagement: wie wichtig ist echtes, hohes Engagement (statt nur Reichweite).
- styleMatch: wie wichtig ist, dass der Bild-/Markenstil des Creators zum Geschäft passt.
- reach: wie wichtig ist reine Reichweite / hohe Follower-Zahl.
Antworte NUR mit JSON: {"localAudience":number,"engagement":number,"styleMatch":number,"reach":number}.
Beispiel "mehr Laufkundschaft aus der Nachbarschaft": {"localAudience":0.9,"engagement":0.8,"styleMatch":0.4,"reach":0.1}.
Beispiel "deutschlandweit bekannt werden": {"localAudience":0.1,"engagement":0.4,"styleMatch":0.4,"reach":0.95}.`;

export async function goalToWeights(goalText: string, presetId?: string): Promise<Weights> {
  if (presetId && PRESET_WEIGHTS[presetId]) return PRESET_WEIGHTS[presetId];
  try {
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_WEIGHTS },
        { role: "user", content: goalText || "mehr Gäste aus der Nachbarschaft" },
      ],
    });
    return normalizeWeights(JSON.parse(res.choices[0].message.content || "{}"));
  } catch {
    return PRESET_WEIGHTS.local_traffic; // safe fallback so the demo never breaks
  }
}

export async function generateReport(
  biz: BusinessProfile,
  result: MatchResult,
  weights: Weights,
): Promise<string[]> {
  const facts = result.contributions
    .map((c) => `${c.label}: Wert ${(c.value * 100).toFixed(0)}%, Wichtigkeit ${(c.weight * 100).toFixed(0)}%`)
    .join("; ");
  const prompt = `Geschäft: ${biz.name} (${biz.category}, ${biz.city}). Ziel-Gewichte und Creator-Werte: ${facts}.
Creator: ${result.creator.handle}, ${result.creator.followers} Follower, Engagement ${(result.creator.engagementRate * 100).toFixed(1)}%, Zielgruppe in ${result.creator.audienceCity}.
Score: ${result.score}/100.
Schreibe 3 kurze, konkrete deutsche Stichpunkte, warum dieser Creator zum Ziel des Geschäfts passt (oder nicht). Nenne Zahlen. Kein Marketing-Geschwurbel.
Antworte NUR mit JSON: {"bullets": ["...","...","..."]}.`;
  try {
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    });
    const parsed = JSON.parse(res.choices[0].message.content || "{}");
    return Array.isArray(parsed.bullets) ? parsed.bullets.slice(0, 3) : [];
  } catch {
    return [result.shortReason];
  }
}
```

- [ ] **Step 2: No standalone run here** — verified live in Task 4/5 through the routes.

---

### Task 4: Routes — extract-business, extract-creator, match

**Files:**
- Create: `app/api/extract-business/route.ts`
- Create: `app/api/extract-creator/route.ts`
- Create: `app/api/match/route.ts`

- [ ] **Step 1: `app/api/extract-business/route.ts`** — mocked extraction. Returns the starter business regardless of URL, so it always looks like it worked.

```ts
import { NextResponse } from "next/server";
import businesses from "@/lib/fixtures/businesses.json";
import { BusinessProfile } from "@/lib/types";

// TODO: später echte Website-Analyse (Crawl + LLM). Für die Demo gemockt.
export async function POST(req: Request) {
  const { url } = await req.json().catch(() => ({ url: "" }));
  const biz = (businesses as BusinessProfile[])[0];
  // Reflect the typed URL into the name so the demo feels live.
  const host = (() => { try { return new URL(url.startsWith("http") ? url : `https://${url}`).hostname; } catch { return ""; } })();
  return NextResponse.json({ ...biz, description: host ? `${biz.description} (Quelle: ${host})` : biz.description });
}
```

- [ ] **Step 2: `app/api/extract-creator/route.ts`** — mocked extraction. Matches a fixture by handle if possible, else returns the first.

```ts
import { NextResponse } from "next/server";
import creators from "@/lib/fixtures/creators.json";
import { CreatorProfile } from "@/lib/types";

// TODO: später echte Instagram/TikTok-Analyse. Für die Demo gemockt.
export async function POST(req: Request) {
  const { link } = await req.json().catch(() => ({ link: "" }));
  const all = creators as CreatorProfile[];
  const needle = String(link || "").toLowerCase();
  const match = all.find((c) => needle.includes(c.handle.replace("@", "").toLowerCase())) ?? all[0];
  return NextResponse.json(match);
}
```

- [ ] **Step 3: `app/api/match/route.ts`** — the core. Goal→weights, then deterministic ranking.

```ts
import { NextResponse } from "next/server";
import creators from "@/lib/fixtures/creators.json";
import { CreatorProfile, BusinessProfile, MatchResponse } from "@/lib/types";
import { goalToWeights } from "@/lib/llm";
import { rankCreators } from "@/lib/matcher";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const business = body.business as BusinessProfile;
  if (!business) return NextResponse.json({ error: "business required" }, { status: 400 });
  const weights = await goalToWeights(body.goalText ?? "", body.presetId);
  const results = rankCreators(business, creators as CreatorProfile[], weights);
  const payload: MatchResponse = { weights, results };
  return NextResponse.json(payload);
}
```

- [ ] **Step 4: Run the dev server and test the match route end-to-end.**

Run (terminal 1): `npm run dev`
Run (terminal 2):
```bash
curl -s localhost:3000/api/match -H 'content-type: application/json' \
  -d '{"business":{"id":"biz_trattoria","name":"Trattoria Bella","category":"Italienisches Restaurant","city":"Hamburg","styleTags":["warm","rustikal","authentisch"],"description":"x"},"presetId":"local_traffic"}' | npx json
```
Expected: JSON with `weights` and a `results` array. **`@lisa_hamburg_eats` must rank first (highest score, green)** and `@foodie_germany` must rank low — that is the Moneyball moment, verified.

- [ ] **Step 5: Verify the goal flips the ranking.**

Run the same curl but with `"presetId":"city_awareness"`.
Expected: now `@foodie_germany` (210k reach) ranks at or near the top and `@lisa_hamburg_eats` drops. If the order flips, the adaptive matching works.

- [ ] **Step 6: Commit.**

```bash
git add app/api/extract-business app/api/extract-creator app/api/match lib/matcher.ts lib/llm.ts lib/fixtures
git commit -m "feat(backend): mocked extraction + goal-weighted matching engine"
```

---

### Task 5: Route — report (LLM reason bullets for the detail view)

**Files:**
- Create: `app/api/report/route.ts`

- [ ] **Step 1: `app/api/report/route.ts`**

```ts
import { NextResponse } from "next/server";
import { BusinessProfile, MatchResult, Weights } from "@/lib/types";
import { generateReport } from "@/lib/llm";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const business = body.business as BusinessProfile;
  const result = body.result as MatchResult;
  const weights = body.weights as Weights;
  if (!business || !result) return NextResponse.json({ error: "business and result required" }, { status: 400 });
  const bullets = await generateReport(business, result, weights);
  return NextResponse.json({ bullets });
}
```

- [ ] **Step 2: Test the report route (needs a valid OPENAI_API_KEY).**

Run:
```bash
curl -s localhost:3000/api/report -H 'content-type: application/json' \
  -d '{"business":{"id":"b","name":"Trattoria Bella","category":"Italienisches Restaurant","city":"Hamburg","styleTags":["warm"],"description":"x"},"weights":{"localAudience":0.9,"engagement":0.8,"styleMatch":0.4,"reach":0.1},"result":{"creator":{"handle":"@lisa_hamburg_eats","followers":8400,"engagementRate":0.082,"audienceCity":"Hamburg"},"score":92,"light":"green","shortReason":"x","contributions":[{"key":"localAudience","label":"Lokale Zielgruppe","value":0.71,"weight":0.9}]}}'
```
Expected: JSON `{ "bullets": ["...", "...", "..."] }` — three short German sentences mentioning numbers. If the key is missing it falls back to one bullet (still valid JSON).

- [ ] **Step 3: Commit.**

```bash
git add app/api/report && git commit -m "feat(backend): LLM-generated collab report bullets"
```

---

## Done when

- All four routes respond with the right shapes.
- `presetId: local_traffic` ranks the small local creator first; `city_awareness` flips it. (The demo's whole point.)
- `npm run build` succeeds with no type errors.

Final check: `npm run build` → expect "Compiled successfully".
