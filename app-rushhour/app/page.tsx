"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BusinessProfile, ExtractBusinessResult, MatchResult, Weights, GOAL_PRESETS } from "@/lib/types";
import { extractBusiness, match } from "@/lib/api-client";
import { CreatorCard } from "@/components/CreatorCard";
import { GoalChat } from "@/components/GoalChat";
import { BusinessScrapeReveal } from "@/components/BusinessScrapeReveal";
import { saveMatchContext } from "@/lib/reservations";

type Step = "intake" | "scraping" | "goal" | "results";

const GOAL_ICON: Record<string, string> = {
  local_traffic: "📍",
  city_awareness: "🌆",
  premium_image: "✨",
};

export default function Home() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("intake");
  const [url, setUrl] = useState("");
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [scrape, setScrape] = useState<ExtractBusinessResult | null>(null);
  const [presetId, setPresetId] = useState<string>("local_traffic");
  const [results, setResults] = useState<MatchResult[]>([]);
  const [, setWeights] = useState<Weights | null>(null);
  const [loading, setLoading] = useState(false);

  async function submitUrl() {
    setScrape(null);
    setStep("scraping");
    try {
      const r = await extractBusiness(url || "trattoria-bella.de");
      setBusiness(r.profile);
      setScrape(r);
    } catch {
      setStep("intake"); // route degrades server-side; this only fires on a hard network error
    }
  }

  async function runMatch(preset: string, goalText = "") {
    if (!business) return;
    setPresetId(preset);
    setLoading(true);
    const res = await match(business, goalText, preset);
    setResults(res.results);
    setWeights(res.weights);
    saveMatchContext({ business, weights: res.weights, results: res.results });
    setLoading(false);
    setStep("results");
  }

  return (
    <main className="flex-1">
      {/* ---------- INTAKE ---------- */}
      {step === "intake" && (
        <section className="mx-auto flex max-w-3xl flex-col items-center px-5 pt-20 pb-24 text-center">
          <span className="rounded-full bg-rausch/10 px-4 py-1.5 text-sm font-semibold text-rausch">
            AI matching for local brands
          </span>
          <h1 className="mt-6 text-4xl font-extrabold leading-[1.1] tracking-tight text-ink sm:text-6xl">
            Find the creator
            <br />
            who hits your <span className="text-rausch">goal</span>.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted">
            No endless searching. Enter your website — our AI predicts which
            collaboration will really work for you.
          </p>

          <div className="mt-9 flex w-full max-w-xl items-center gap-2 rounded-full bg-white p-2 shadow-pill ring-1 ring-line focus-within:ring-2 focus-within:ring-rausch">
            <span aria-hidden className="pl-3 text-lg text-muted">
              🔍
            </span>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitUrl()}
              placeholder="your-website.com"
              aria-label="Your business website"
              className="flex-1 bg-transparent px-1 py-2 text-base outline-none placeholder:text-muted"
            />
            <button
              onClick={submitUrl}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full bg-rausch px-6 py-3 font-semibold text-white transition hover:bg-rausch-dark disabled:opacity-50"
            >
              {loading ? "Analyzing…" : "Find matches"}
            </button>
          </div>
          <p className="mt-4 text-sm text-muted">As easy as an Airbnb listing — in 30 seconds.</p>
        </section>
      )}

      {/* ---------- SCRAPING REVEAL ---------- */}
      {step === "scraping" && (
        <section className="mx-auto max-w-xl px-5 pt-10 pb-24">
          <button onClick={() => setStep("intake")} className="text-sm font-medium text-muted hover:text-ink">
            ← Back
          </button>
          <div className="mt-4">
            <BusinessScrapeReveal
              url={url || "trattoria-bella.de"}
              data={scrape}
              onContinue={() => setStep("goal")}
            />
          </div>
        </section>
      )}

      {/* ---------- GOAL (conversational, by teammate) ---------- */}
      {step === "goal" && business && (
        <section className="mx-auto max-w-xl px-5 pt-10 pb-24">
          <button onClick={() => setStep("intake")} className="text-sm font-medium text-muted hover:text-ink">
            ← Back
          </button>
          <div className="mt-4 rounded-3xl bg-white p-5 shadow-card ring-1 ring-line/70">
            <div className="flex items-center gap-2 border-b border-line/70 pb-3">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-rausch text-white">◆</span>
              <span className="font-semibold text-ink">RushHour Matchmaker</span>
              <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-muted">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> online
              </span>
            </div>
            <GoalChat business={business} onComplete={(preset, goalText) => runMatch(preset, goalText)} />
          </div>
        </section>
      )}

      {/* ---------- RESULTS ---------- */}
      {step === "results" && (
        <section className="mx-auto max-w-6xl px-5 pt-10 pb-24">
          <button onClick={() => setStep("goal")} className="text-sm font-medium text-muted hover:text-ink">
            ← Change goal
          </button>
          <div className="mt-3">
            <h1 className="text-2xl font-bold text-ink sm:text-3xl">
              Top matches{business ? ` for ${business.name}` : ""}
            </h1>
            <p className="mt-1 text-muted">Sorted by the AI by likelihood of success.</p>
          </div>

          {/* Goal filter pills */}
          <div className="mt-5 flex flex-wrap gap-2">
            {GOAL_PRESETS.map((g) => (
              <button
                key={g.id}
                onClick={() => runMatch(g.id)}
                disabled={loading}
                className={`rounded-full px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${
                  presetId === g.id
                    ? "bg-ink text-white"
                    : "bg-white text-ink ring-1 ring-line hover:ring-ink"
                }`}
              >
                {GOAL_ICON[g.id]} {g.label}
              </button>
            ))}
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="overflow-hidden rounded-2xl ring-1 ring-line/70">
                    <div className="aspect-[16/10] w-full animate-pulse bg-cloud" />
                    <div className="space-y-3 p-4">
                      <div className="h-4 w-1/2 animate-pulse rounded bg-cloud" />
                      <div className="h-3 w-3/4 animate-pulse rounded bg-cloud" />
                      <div className="h-2 w-full animate-pulse rounded bg-cloud" />
                    </div>
                  </div>
                ))
              : results.map((r, i) => (
                  <div key={r.creator.id} className="animate-rise" style={{ animationDelay: `${i * 70}ms` }}>
                    <CreatorCard result={r} onClick={() => router.push(`/creators/${r.creator.id}`)} />
                  </div>
                ))}
          </div>
        </section>
      )}
    </main>
  );
}
