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
