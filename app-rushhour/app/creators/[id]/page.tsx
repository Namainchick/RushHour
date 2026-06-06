"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import creatorsData from "@/lib/fixtures/creators.json";
import { CreatorProfile, MatchResult } from "@/lib/types";
import { getCreatorDetail } from "@/lib/creator-details";
import { report } from "@/lib/api-client";
import {
  addReservation,
  getMatchContext,
  hasReservation,
  removeReservation,
} from "@/lib/reservations";
import { SignalBar } from "@/components/SignalBar";

const creators = creatorsData as CreatorProfile[];

function Stars({ value }: { value: number }) {
  const full = Math.round(value);
  return (
    <span className="text-rausch" aria-label={`${value} of 5 stars`}>
      {"★★★★★".slice(0, full)}
      <span className="text-line">{"★★★★★".slice(full)}</span>
    </span>
  );
}

export default function CreatorProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const creator = creators.find((c) => c.id === params.id);
  const detail = getCreatorDetail(params.id);

  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [bullets, setBullets] = useState<string[] | null>(null);
  const [booked, setBooked] = useState(false);

  useEffect(() => {
    if (!creator) return;
    let alive = true;
    const ctx = getMatchContext();
    const r = ctx?.results.find((x) => x.creator.id === creator.id) ?? null;
    // Hydrate from external stores (localStorage / sessionStorage) once mounted.
    const hydrate = () => {
      setBooked(hasReservation(creator.id));
      setMatchResult(r);
    };
    hydrate();
    if (ctx && r) {
      report(ctx.business, r, ctx.weights)
        .then((b) => alive && setBullets(b))
        .catch(() => alive && setBullets([r.shortReason]));
    }
    return () => {
      alive = false;
    };
  }, [creator]);

  const gallery = useMemo(() => {
    if (!creator) return [];
    const all = [creator.coverUrl, ...(detail?.gallery ?? [])].filter(Boolean) as string[];
    return Array.from(new Set(all)).slice(0, 5);
  }, [creator, detail]);

  if (!creator) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-24 text-center">
        <h1 className="text-2xl font-bold text-ink">Creator not found</h1>
        <Link href="/" className="mt-4 inline-block font-semibold text-rausch">
          ← Back to search
        </Link>
      </main>
    );
  }

  function toggleBooking() {
    if (!creator) return;
    if (booked) {
      removeReservation(creator.id);
      setBooked(false);
    } else {
      addReservation({
        creatorId: creator.id,
        handle: creator.handle,
        avatarUrl: creator.avatarUrl,
        coverUrl: creator.coverUrl,
        city: creator.audienceCity,
        score: matchResult?.score,
        light: matchResult?.light,
        priceFrom: detail?.priceFrom,
        status: "angefragt",
        createdAtLabel: new Date().toLocaleDateString("en-US", { day: "numeric", month: "long" }),
        businessName: getMatchContext()?.business.name,
      });
      setBooked(true);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-5 pt-6 pb-24">
      <button onClick={() => router.back()} className="text-sm font-medium text-muted hover:text-ink">
        ← Back to matches
      </button>

      {/* Title */}
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1">
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">{creator.handle}</h1>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink">
        {detail && (
          <>
            <span className="font-semibold">★ {detail.rating.toFixed(2)}</span>
            <span className="text-muted">·</span>
            <span className="underline">{detail.reviewsCount} reviews</span>
            <span className="text-muted">·</span>
          </>
        )}
        <span className="text-muted">
          {creator.audienceCity} · {creator.followers.toLocaleString("en-US")} followers
        </span>
      </div>

      {/* Gallery */}
      <div className="mt-5 grid h-[280px] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-3xl sm:h-[440px]">
        {gallery.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={src}
            alt=""
            className={`h-full w-full object-cover transition duration-500 hover:brightness-95 ${
              i === 0 ? "col-span-2 row-span-2" : "col-span-1 row-span-1"
            }`}
          />
        ))}
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
        {/* LEFT */}
        <div>
          {/* Host block */}
          <div className="flex items-center gap-4 border-b border-line/70 pb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={creator.avatarUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
            <div>
              <div className="text-lg font-semibold text-ink">Creator in {creator.audienceCity}</div>
              <div className="text-sm text-muted">
                {creator.platform === "tiktok" ? "TikTok" : "Instagram"} · Engagement{" "}
                {(creator.engagementRate * 100).toFixed(1)}%
                {detail ? ` · ${detail.responseRate}% response rate` : ""}
              </div>
            </div>
          </div>

          {/* Highlights */}
          {detail && (
            <div className="space-y-4 border-b border-line/70 py-6">
              {detail.highlights.map((h) => (
                <div key={h} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-rausch/10 text-rausch">
                    ✓
                  </span>
                  <span className="text-ink">{h}</span>
                </div>
              ))}
            </div>
          )}

          {/* Bio */}
          {detail && (
            <div className="border-b border-line/70 py-6">
              <h2 className="text-xl font-bold text-ink">About {creator.handle}</h2>
              <p className="mt-3 leading-relaxed text-muted">{detail.bio}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {creator.topics.map((t) => (
                  <span key={t} className="rounded-full bg-cloud px-3 py-1 text-xs font-medium text-ink">
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Why this match (AI) */}
          {matchResult && (
            <div className="border-b border-line/70 py-6">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-rausch text-sm text-white">◆</span>
                <h2 className="text-xl font-bold text-ink">Why this match</h2>
                <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-ink shadow-pill">
                  <span
                    className={
                      matchResult.light === "green"
                        ? "text-emerald-500"
                        : matchResult.light === "yellow"
                          ? "text-amber-400"
                          : "text-rose-500"
                    }
                  >
                    ★
                  </span>
                  {matchResult.score}
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {matchResult.contributions.map((c) => (
                  <SignalBar key={c.key} label={c.label} value={c.value} />
                ))}
              </div>

              <div className="mt-5 rounded-2xl bg-cloud p-4">
                {bullets === null ? (
                  <div className="text-sm text-muted">AI is analyzing the fit…</div>
                ) : (
                  <ul className="space-y-2 text-sm text-ink">
                    {bullets.map((b, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-rausch">•</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Reviews */}
          {detail && (
            <div className="py-6">
              <h2 className="flex items-center gap-2 text-xl font-bold text-ink">
                <Stars value={detail.rating} /> {detail.rating.toFixed(2)} · {detail.reviewsCount} reviews
              </h2>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                {detail.reviews.map((rv, i) => (
                  <div key={i} className="rounded-2xl ring-1 ring-line/70 p-5">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={rv.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                      <div>
                        <div className="font-semibold text-ink">{rv.author}</div>
                        <div className="text-xs text-muted">{rv.business}</div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-sm">
                      <Stars value={rv.rating} />
                      <span className="text-muted">· {rv.date}</span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{rv.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — sticky booking box */}
        <aside className="lg:relative">
          <div className="lg:sticky lg:top-24 rounded-3xl bg-white p-6 shadow-card ring-1 ring-line/70">
            <div className="flex items-baseline justify-between">
              <div>
                {detail && (
                  <span className="text-2xl font-bold text-ink">
                    from €{detail.priceFrom.toLocaleString("en-US")}
                  </span>
                )}
                <span className="text-sm text-muted"> / collaboration</span>
              </div>
              {detail && <span className="text-sm font-semibold text-ink">★ {detail.rating.toFixed(2)}</span>}
            </div>

            {matchResult && (
              <div className="mt-4 flex items-center justify-between rounded-xl bg-cloud px-4 py-3 text-sm">
                <span className="text-muted">Your match score</span>
                <span className="font-bold text-ink">{matchResult.score}/100</span>
              </div>
            )}

            <button
              onClick={toggleBooking}
              className={`mt-4 w-full rounded-xl py-3.5 font-semibold transition ${
                booked
                  ? "bg-emerald-500 text-white hover:bg-emerald-600"
                  : "bg-rausch text-white hover:bg-rausch-dark"
              }`}
            >
              {booked ? "✓ Requested — in reservations" : "Request collaboration"}
            </button>

            {booked ? (
              <Link
                href="/reservations"
                className="mt-3 block text-center text-sm font-medium text-rausch hover:underline"
              >
                Go to your reservations →
              </Link>
            ) : (
              <p className="mt-3 text-center text-xs text-muted">You won't be charged yet.</p>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
