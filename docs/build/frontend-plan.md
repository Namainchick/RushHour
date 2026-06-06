# RushHour Frontend — Implementation Plan (Agent A)

> **For agentic workers:** Implement this plan task by task. Steps use checkbox (`- [ ]`) syntax for tracking. This is a hackathon proof-of-concept. There are no unit-test cycles — each task ends with a concrete "open this page, see this" check in the browser.

**Goal:** Build the four demo screens — paste a business link, pick a goal, see creators ranked with a score + traffic light + one-line reason, and a detail "Collab-Auskunft". Plus a creator-onboarding page (paste a social link → see the extracted profile).

**Architecture:** A single client-driven flow in `app/page.tsx` with three steps (intake → goal → results). All data goes through `lib/api-client.ts`, which either calls the real backend routes or returns local mock data based on a flag — so you can build the entire UI **before the backend exists**. A separate `app/creator/page.tsx` covers the influencer signup.

**Tech Stack:** Next.js App Router (client components), TypeScript, Tailwind.

**Prerequisite:** `00-setup.md` has been run. `lib/types.ts` exists. **Do not edit `lib/types.ts`.** You own only `app/page.tsx`, `app/match/`, `app/creator/`, `components/`, `lib/api-client.ts`, `lib/mock-data.ts`.

**Build standalone first:** add `NEXT_PUBLIC_USE_MOCK=true` to `.env.local` while building. Then the UI runs entirely on mock data and never needs the backend. At integration time, remove that line (or set it to `false`).

**Contract you must honor** (from `lib/types.ts`, read-only) — same types the backend produces:

```ts
type BusinessProfile = { id; name; category; city; neighborhood?; styleTags: string[]; description };
type CreatorProfile  = { id; handle; platform; followers; avatarUrl; topics: string[]; styleTags: string[]; audienceCity; engagementRate; signals: { localShare; engagement; reach } };
type Weights         = { localAudience; engagement; styleMatch; reach };
type FeatureContribution = { key: keyof Weights; label: string; value: number; weight: number };
type MatchResult     = { creator: CreatorProfile; score: number; light: "green"|"yellow"|"red"; shortReason: string; contributions: FeatureContribution[] };
type MatchResponse   = { weights: Weights; results: MatchResult[] };
const GOAL_PRESETS: { id: string; label: string }[]; // local_traffic, city_awareness, premium_image
```

---

### Task 1: API client + mock data

**Files:**
- Create: `lib/mock-data.ts`
- Create: `lib/api-client.ts`

- [ ] **Step 1: `lib/mock-data.ts`** — lets the UI run with no backend. Two orderings so the goal-switch reorder is visible in mock mode too.

```ts
import { BusinessProfile, CreatorProfile, MatchResponse, MatchResult } from "./types";

export const MOCK_BUSINESS: BusinessProfile = {
  id: "biz_trattoria", name: "Trattoria Bella", category: "Italienisches Restaurant",
  city: "Hamburg", neighborhood: "Eppendorf",
  styleTags: ["warm", "rustikal", "authentisch"],
  description: "Familiengeführtes italienisches Restaurant in Hamburg-Eppendorf.",
};

export const MOCK_CREATOR: CreatorProfile = {
  id: "cr_lisa", handle: "@lisa_hamburg_eats", platform: "instagram", followers: 8400,
  avatarUrl: "https://i.pravatar.cc/150?img=47", topics: ["food", "local", "lifestyle"],
  styleTags: ["warm", "authentisch", "cozy"], audienceCity: "Hamburg", engagementRate: 0.082,
  signals: { localShare: 0.71, engagement: 0.9, reach: 0.25 },
};

const lisa: CreatorProfile = MOCK_CREATOR;
const foodie: CreatorProfile = {
  id: "cr_foodie_de", handle: "@foodie_germany", platform: "instagram", followers: 210000,
  avatarUrl: "https://i.pravatar.cc/150?img=12", topics: ["food", "travel"], styleTags: ["clean", "modern"],
  audienceCity: "Berlin", engagementRate: 0.018, signals: { localShare: 0.08, engagement: 0.4, reach: 0.95 },
};

function r(creator: CreatorProfile, score: number, light: MatchResult["light"], shortReason: string): MatchResult {
  return { creator, score, light, shortReason, contributions: [
    { key: "localAudience", label: "Lokale Zielgruppe", value: creator.signals.localShare, weight: 0.9 },
    { key: "engagement", label: "Echtes Engagement", value: creator.signals.engagement, weight: 0.8 },
    { key: "styleMatch", label: "Stil-Match", value: 0.5, weight: 0.4 },
    { key: "reach", label: "Reichweite", value: creator.signals.reach, weight: 0.1 },
  ]};
}

export function mockMatch(presetId?: string): MatchResponse {
  if (presetId === "city_awareness") {
    return { weights: { localAudience: 0.2, engagement: 0.5, styleMatch: 0.4, reach: 0.9 },
      results: [ r(foodie, 88, "green", "Große Reichweite, modern."), r(lisa, 54, "yellow", "Starke lokale Zielgruppe, hohes echtes Engagement.") ] };
  }
  return { weights: { localAudience: 0.9, engagement: 0.8, styleMatch: 0.4, reach: 0.1 },
    results: [ r(lisa, 92, "green", "Starke lokale Zielgruppe, hohes echtes Engagement."), r(foodie, 61, "yellow", "Große Reichweite, aber bundesweit.") ] };
}

export function mockReport(result: MatchResult): string[] {
  return [
    `${Math.round(result.creator.signals.localShare * 100)}% der Follower wohnen in ${result.creator.audienceCity}`,
    `Engagement ${(result.creator.engagementRate * 100).toFixed(1)}% — deutlich über dem Influencer-Schnitt`,
    "Bildstil passt zum warmen, rustikalen Look des Restaurants",
  ];
}
```

- [ ] **Step 2: `lib/api-client.ts`**

```ts
import { BusinessProfile, CreatorProfile, MatchResponse, MatchResult, Weights } from "./types";
import { MOCK_BUSINESS, MOCK_CREATOR, mockMatch, mockReport } from "./mock-data";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function extractBusiness(url: string): Promise<BusinessProfile> {
  if (USE_MOCK) return MOCK_BUSINESS;
  return post<BusinessProfile>("/api/extract-business", { url });
}
export async function extractCreator(link: string): Promise<CreatorProfile> {
  if (USE_MOCK) return MOCK_CREATOR;
  return post<CreatorProfile>("/api/extract-creator", { link });
}
export async function match(business: BusinessProfile, goalText: string, presetId?: string): Promise<MatchResponse> {
  if (USE_MOCK) return mockMatch(presetId);
  return post<MatchResponse>("/api/match", { business, goalText, presetId });
}
export async function report(business: BusinessProfile, result: MatchResult, weights: Weights): Promise<string[]> {
  if (USE_MOCK) return mockReport(result);
  const r = await post<{ bullets: string[] }>("/api/report", { business, result, weights });
  return r.bullets;
}
```

- [ ] **Step 3: Verify it type-checks.** Run: `npx tsc --noEmit`. Expected: no errors (components come next; this file alone is clean).

---

### Task 2: Small presentational components

**Files:**
- Create: `components/ScoreBadge.tsx`
- Create: `components/SignalBar.tsx`

- [ ] **Step 1: `components/ScoreBadge.tsx`** — the traffic-light + score chip.

```tsx
import { TrafficLight } from "@/lib/types";

const DOT: Record<TrafficLight, string> = { green: "bg-emerald-500", yellow: "bg-amber-400", red: "bg-rose-500" };
const RING: Record<TrafficLight, string> = { green: "ring-emerald-500/30", yellow: "ring-amber-400/30", red: "ring-rose-500/30" };

export function ScoreBadge({ score, light }: { score: number; light: TrafficLight }) {
  return (
    <div className={`flex items-center gap-2 rounded-full bg-white px-3 py-1.5 ring-2 ${RING[light]}`}>
      <span className={`h-2.5 w-2.5 rounded-full ${DOT[light]}`} />
      <span className="text-sm font-semibold tabular-nums text-neutral-900">{score}</span>
    </div>
  );
}
```

- [ ] **Step 2: `components/SignalBar.tsx`** — a labeled 0..1 bar.

```tsx
export function SignalBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-neutral-500">
        <span>{label}</span><span className="tabular-nums">{pct}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-neutral-100">
        <div className="h-full rounded-full bg-neutral-900 transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit.** `git add components/ScoreBadge.tsx components/SignalBar.tsx && git commit -m "feat(fe): score badge + signal bar"`

---

### Task 3: CreatorCard + CollabReport (detail)

**Files:**
- Create: `components/CreatorCard.tsx`
- Create: `components/CollabReport.tsx`

- [ ] **Step 1: `components/CreatorCard.tsx`**

```tsx
"use client";
import { MatchResult } from "@/lib/types";
import { ScoreBadge } from "./ScoreBadge";
import { SignalBar } from "./SignalBar";

export function CreatorCard({ result, onClick }: { result: MatchResult; onClick: () => void }) {
  const { creator } = result;
  const local = result.contributions.find((c) => c.key === "localAudience");
  return (
    <button onClick={onClick} className="w-full rounded-2xl border border-neutral-200 bg-white p-4 text-left transition hover:border-neutral-300 hover:shadow-sm">
      <div className="flex items-center gap-3">
        <img src={creator.avatarUrl} alt="" className="h-11 w-11 rounded-full object-cover" />
        <div className="flex-1">
          <div className="font-semibold text-neutral-900">{creator.handle}</div>
          <div className="text-xs text-neutral-500">{creator.followers.toLocaleString("de-DE")} Follower · {creator.audienceCity}</div>
        </div>
        <ScoreBadge score={result.score} light={result.light} />
      </div>
      {local && <div className="mt-3"><SignalBar label={local.label} value={local.value} /></div>}
      <p className="mt-3 text-sm text-neutral-600">{result.shortReason}</p>
    </button>
  );
}
```

- [ ] **Step 2: `components/CollabReport.tsx`** — modal-style detail that fetches LLM bullets.

```tsx
"use client";
import { useEffect, useState } from "react";
import { BusinessProfile, MatchResult, Weights } from "@/lib/types";
import { report } from "@/lib/api-client";
import { ScoreBadge } from "./ScoreBadge";
import { SignalBar } from "./SignalBar";

export function CollabReport({ business, result, weights, onClose }: {
  business: BusinessProfile; result: MatchResult; weights: Weights; onClose: () => void;
}) {
  const [bullets, setBullets] = useState<string[] | null>(null);
  useEffect(() => {
    let alive = true;
    report(business, result, weights).then((b) => alive && setBullets(b)).catch(() => alive && setBullets([result.shortReason]));
    return () => { alive = false; };
  }, [business, result, weights]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="font-semibold text-neutral-900">{result.creator.handle}</div>
          <ScoreBadge score={result.score} light={result.light} />
        </div>
        <div className="mt-4 space-y-2">
          {result.contributions.map((c) => <SignalBar key={c.key} label={c.label} value={c.value} />)}
        </div>
        <div className="mt-5">
          <div className="text-sm font-medium text-neutral-900">Warum dieser Match:</div>
          {bullets === null ? (
            <div className="mt-2 text-sm text-neutral-400">KI analysiert…</div>
          ) : (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-600">
              {bullets.map((b, i) => <li key={i}>{b}</li>)}
            </ul>
          )}
        </div>
        <button className="mt-6 w-full rounded-xl bg-neutral-900 py-3 text-sm font-medium text-white" onClick={onClose}>
          Match anfragen
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit.** `git add components/CreatorCard.tsx components/CollabReport.tsx && git commit -m "feat(fe): creator card + collab report detail"`

---

### Task 4: The main flow — intake → goal → results

**Files:**
- Create: `app/page.tsx`

- [ ] **Step 1: `app/page.tsx`** — full client flow.

```tsx
"use client";
import { useState } from "react";
import { BusinessProfile, MatchResult, Weights, GOAL_PRESETS } from "@/lib/types";
import { extractBusiness, match } from "@/lib/api-client";
import { CreatorCard } from "@/components/CreatorCard";
import { CollabReport } from "@/components/CollabReport";

type Step = "intake" | "goal" | "results";

export default function Home() {
  const [step, setStep] = useState<Step>("intake");
  const [url, setUrl] = useState("");
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [presetId, setPresetId] = useState<string>("local_traffic");
  const [results, setResults] = useState<MatchResult[]>([]);
  const [weights, setWeights] = useState<Weights | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<MatchResult | null>(null);

  async function submitUrl() {
    setLoading(true);
    const biz = await extractBusiness(url || "trattoria-bella.de");
    setBusiness(biz); setLoading(false); setStep("goal");
  }
  async function runMatch(preset: string) {
    if (!business) return;
    setPresetId(preset); setLoading(true);
    const res = await match(business, "", preset);
    setResults(res.results); setWeights(res.weights); setLoading(false); setStep("results");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col px-5 py-10">
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900">RushHour</h1>

      {step === "intake" && (
        <div className="mt-16">
          <p className="text-lg text-neutral-700">Finde den Creator, der dein Ziel trifft.</p>
          <div className="mt-6 flex gap-2">
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="deine-website.de"
              className="flex-1 rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900" />
            <button onClick={submitUrl} disabled={loading}
              className="rounded-xl bg-neutral-900 px-5 py-3 font-medium text-white disabled:opacity-50">
              {loading ? "…" : "Los →"}
            </button>
          </div>
          <p className="mt-3 text-sm text-neutral-400">So einfach wie ein Airbnb-Inserat.</p>
        </div>
      )}

      {step === "goal" && business && (
        <div className="mt-12">
          <div className="rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-600">
            Erkannt: <span className="font-medium text-neutral-900">{business.name}</span> · {business.category} · {business.city}
          </div>
          <p className="mt-8 text-lg text-neutral-700">Was willst du erreichen?</p>
          <div className="mt-4 space-y-2">
            {GOAL_PRESETS.map((g) => (
              <button key={g.id} onClick={() => runMatch(g.id)} disabled={loading}
                className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-left hover:border-neutral-900 disabled:opacity-50">
                {g.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "results" && (
        <div className="mt-8">
          <label className="text-sm text-neutral-500">Ziel</label>
          <select value={presetId} onChange={(e) => runMatch(e.target.value)}
            className="mt-1 w-full rounded-xl border border-neutral-300 px-4 py-3">
            {GOAL_PRESETS.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
          </select>
          <div className="mt-5 space-y-3">
            {loading && <div className="text-sm text-neutral-400">KI matcht…</div>}
            {!loading && results.map((r) => (
              <CreatorCard key={r.creator.id} result={r} onClick={() => setSelected(r)} />
            ))}
          </div>
        </div>
      )}

      {selected && business && weights && (
        <CollabReport business={business} result={selected} weights={weights} onClose={() => setSelected(null)} />
      )}
    </main>
  );
}
```

- [ ] **Step 2: Run and click through the whole flow.**

Run: `npm run dev`, open `http://localhost:3000`.
Expected: type anything → "Los" → see the recognized business → pick "Mehr Gäste aus der Nachbarschaft" → **`@lisa_hamburg_eats` is on top with a green 92**, `@foodie_germany` below. Change the goal dropdown to "Stadtweit bekannter werden" → **the order flips**. Click a card → detail opens with bullets.

- [ ] **Step 3: Commit.** `git add app/page.tsx && git commit -m "feat(fe): intake → goal → results flow"`

---

### Task 5: Creator onboarding page (influencer signup mock)

**Files:**
- Create: `app/creator/page.tsx`

- [ ] **Step 1: `app/creator/page.tsx`**

```tsx
"use client";
import { useState } from "react";
import { CreatorProfile } from "@/lib/types";
import { extractCreator } from "@/lib/api-client";
import { SignalBar } from "@/components/SignalBar";

export default function CreatorOnboarding() {
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<CreatorProfile | null>(null);

  async function submit() {
    setLoading(true);
    const p = await extractCreator(link || "instagram.com/lisa_hamburg_eats");
    setProfile(p); setLoading(false);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col px-5 py-10">
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900">RushHour für Creators</h1>
      <p className="mt-2 text-neutral-600">Link rein — wir bauen dein Profil automatisch.</p>
      <div className="mt-6 flex gap-2">
        <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="instagram.com/dein_handle"
          className="flex-1 rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900" />
        <button onClick={submit} disabled={loading}
          className="rounded-xl bg-neutral-900 px-5 py-3 font-medium text-white disabled:opacity-50">
          {loading ? "…" : "Analysieren"}
        </button>
      </div>

      {profile && (
        <div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <img src={profile.avatarUrl} alt="" className="h-12 w-12 rounded-full object-cover" />
            <div>
              <div className="font-semibold text-neutral-900">{profile.handle}</div>
              <div className="text-xs text-neutral-500">{profile.followers.toLocaleString("de-DE")} Follower · {profile.audienceCity}</div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.topics.map((t) => <span key={t} className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-700">{t}</span>)}
          </div>
          <div className="mt-5 space-y-2">
            <SignalBar label="Lokale Zielgruppe" value={profile.signals.localShare} />
            <SignalBar label="Echtes Engagement" value={profile.signals.engagement} />
            <SignalBar label="Reichweite" value={profile.signals.reach} />
          </div>
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 2: Verify.** Open `http://localhost:3000/creator` → paste anything → "Analysieren" → an extracted creator profile card with tags and signal bars appears.

- [ ] **Step 3: Commit.** `git add app/creator/page.tsx && git commit -m "feat(fe): creator onboarding mock page"`

---

## Done when

- The business flow runs end to end and the **goal-switch visibly reorders the list** (the demo's whole point).
- The creator page shows an extracted profile from a pasted link.
- Works in mock mode (`NEXT_PUBLIC_USE_MOCK=true`) with no backend, and against the real backend with it removed.

Final check: `npm run build` → expect "Compiled successfully".

## Integration with the backend

When both agents are done: in `.env.local` remove `NEXT_PUBLIC_USE_MOCK=true` (or set `false`), restart `npm run dev`. The same UI now calls the real routes. Nothing else changes, because both sides built against `lib/types.ts`.
