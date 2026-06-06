# RushHour — Setup (RUN ONCE, by Nam, before launching the two agents)

> **Do this yourself, once.** Then hand `frontend-plan.md` to Agent A and `backend-plan.md` to Agent B. After this setup, the two agents touch completely separate folders and never collide.

**Goal:** Scaffold a Next.js app, lock the shared contract (`lib/types.ts`), set up the OpenAI key, and create the data folders. Everything below is ~10 minutes.

**Tech Stack:** Next.js (App Router) + TypeScript + Tailwind + OpenAI SDK. No database — all data is JSON fixtures.

---

## Step 0.1: Scaffold the project

Run in `/Users/namanh/Hackathon/AIBeavers/RushHour`:

```bash
npx create-next-app@latest app-rushhour --typescript --tailwind --eslint --app --src-dir=false --import-alias "@/*" --no-turbopack
cd app-rushhour
npm install openai
```

When asked, accept defaults. This creates the Next.js project in `RushHour/app-rushhour/`. All paths below are relative to that folder.

## Step 0.2: OpenAI key

Create `app-rushhour/.env.local`:

```
OPENAI_API_KEY=sk-...your-key...
```

(Use the OpenAI key from the hackathon sponsor. The backend reads this; the frontend never sees it.)

## Step 0.3: The shared contract — `lib/types.ts`

Create `app-rushhour/lib/types.ts` with EXACTLY this content. **Neither agent may change this file.** It is the seam between frontend and backend.

```ts
// lib/types.ts — SHARED CONTRACT. Do not edit without updating both build plans.

export type Platform = "instagram" | "tiktok";

export type BusinessProfile = {
  id: string;
  name: string;
  category: string;       // e.g. "Italienisches Restaurant"
  city: string;           // e.g. "Hamburg"
  neighborhood?: string;  // e.g. "Eppendorf"
  styleTags: string[];    // e.g. ["warm", "rustikal", "familiär"]
  description: string;    // one short paragraph
};

export type CreatorSignals = {
  localShare: number;   // 0..1 share of audience in creator.audienceCity
  engagement: number;   // 0..1 normalized real engagement quality
  reach: number;        // 0..1 log-normalized follower scale
};

export type CreatorProfile = {
  id: string;
  handle: string;          // "@lisa_hamburg_eats"
  platform: Platform;
  followers: number;       // raw count for display
  avatarUrl: string;       // placeholder URL is fine
  topics: string[];        // ["food", "local", "lifestyle"]
  styleTags: string[];     // ["warm", "authentisch"]
  audienceCity: string;    // "Hamburg"
  engagementRate: number;  // 0..1 for display, e.g. 0.082
  signals: CreatorSignals;
};

// The four weighting dimensions the goal maps onto.
export type Weights = {
  localAudience: number; // 0..1
  engagement: number;    // 0..1
  styleMatch: number;    // 0..1
  reach: number;         // 0..1
};

export type TrafficLight = "green" | "yellow" | "red";

export type FeatureContribution = {
  key: keyof Weights;
  label: string;   // German UI label, e.g. "Lokale Zielgruppe"
  value: number;   // 0..1 feature value for this creator+business
  weight: number;  // 0..1 applied weight
};

export type MatchResult = {
  creator: CreatorProfile;
  score: number;            // 0..100
  light: TrafficLight;
  shortReason: string;      // one line for the card (instant, templated)
  contributions: FeatureContribution[];
};

export type MatchResponse = {
  weights: Weights;
  results: MatchResult[];   // sorted by score desc
};

export type GoalPreset = { id: string; label: string };

export const GOAL_PRESETS: GoalPreset[] = [
  { id: "local_traffic",  label: "Mehr Gäste aus der Nachbarschaft" },
  { id: "city_awareness", label: "Stadtweit bekannter werden" },
  { id: "premium_image",  label: "Premium-Image aufbauen" },
];
```

## Step 0.4: The API contract (read-only reference for both agents)

These are the four endpoints. The backend implements them, the frontend calls them. Request/response shapes use the types above.

| Method + path | Request body | Response |
|---|---|---|
| `POST /api/extract-business` | `{ url: string }` | `BusinessProfile` |
| `POST /api/extract-creator` | `{ link: string }` | `CreatorProfile` |
| `POST /api/match` | `{ business: BusinessProfile, goalText: string, presetId?: string }` | `MatchResponse` |
| `POST /api/report` | `{ business: BusinessProfile, result: MatchResult, weights: Weights }` | `{ bullets: string[] }` |

## Step 0.5: Folder ownership (so the agents never collide)

- **Agent A (frontend) owns:** `app/page.tsx`, `app/match/`, `app/creator/`, `components/`, `lib/api-client.ts`, `lib/mock-data.ts`.
- **Agent B (backend) owns:** `app/api/`, `lib/matcher.ts`, `lib/llm.ts`, `lib/fixtures/`.
- **Shared, already created here, nobody edits:** `lib/types.ts`, `.env.local`.

## Step 0.6: Commit the baseline

```bash
git add -A && git commit -m "chore: scaffold RushHour app + shared contract"
```

Now launch both agents in parallel: Agent A gets `frontend-plan.md`, Agent B gets `backend-plan.md`.

## Note on the 15 influencers + businesses

The data is NOT produced by a live extraction pipeline. Agent B creates a small starter fixture (3–4 creators, 1 business) so everything runs. **You** expand it later to ~15 influencers and a few businesses using a Claude session, writing into `lib/fixtures/creators.json` and `lib/fixtures/businesses.json` in the exact `CreatorProfile` / `BusinessProfile` shape. This is a proof of concept — the pipeline only has to look real in the repo, not actually scrape.
