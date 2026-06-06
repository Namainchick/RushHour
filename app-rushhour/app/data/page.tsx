"use client";
import { useEffect, useState } from "react";
import type { BusinessOverview, CreatorOverview } from "@/lib/db";

type Overview = { businesses: BusinessOverview[]; creators: CreatorOverview[] };

function hostOf(url?: string | null): string {
  if (!url) return "";
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-cloud px-2.5 py-0.5 text-xs font-medium text-ink">{children}</span>;
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-0.5 flex justify-between text-[11px] text-muted">
        <span>{label}</span>
        <span>{Math.round(value * 100)}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-cloud">
        <div className="h-full rounded-full bg-rausch" style={{ width: `${Math.round(value * 100)}%` }} />
      </div>
    </div>
  );
}

export default function DataPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/overview")
      .then((r) => r.json())
      .then((d: Overview & { error?: string }) => {
        if (d.error) setError(d.error);
        setData({ businesses: d.businesses ?? [], creators: d.creators ?? [] });
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  const businesses = data?.businesses ?? [];
  const creators = data?.creators ?? [];

  return (
    <main className="mx-auto max-w-6xl px-5 pt-12 pb-24">
      <div className="text-center">
        <span className="rounded-full bg-rausch/10 px-4 py-1.5 text-sm font-semibold text-rausch">
          Data
        </span>
        <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-ink sm:text-5xl">
          What RushHour has analyzed
        </h1>
        <p className="mt-4 text-lg text-muted">
          Every website and creator link you enter is extracted in a structured way and stored.
          The creator pool grows with every analysis — making the matching better.
        </p>
      </div>

      {/* counters */}
      <div className="mt-8 grid grid-cols-2 gap-4 sm:max-w-md sm:mx-auto">
        <div className="rounded-2xl bg-white p-5 text-center shadow-card ring-1 ring-line/70">
          <div className="text-3xl font-extrabold text-ink">{loading ? "…" : businesses.length}</div>
          <div className="mt-1 text-sm text-muted">Businesses</div>
        </div>
        <div className="rounded-2xl bg-white p-5 text-center shadow-card ring-1 ring-line/70">
          <div className="text-3xl font-extrabold text-ink">{loading ? "…" : creators.length}</div>
          <div className="mt-1 text-sm text-muted">Creator accounts</div>
        </div>
      </div>

      {error && (
        <p className="mt-6 rounded-xl bg-red-50 p-3 text-center text-sm text-red-600">
          Couldn&apos;t load data: {error}
        </p>
      )}

      {/* businesses */}
      <section className="mt-14">
        <h2 className="text-xl font-bold text-ink">Businesses (scraped from website)</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {loading && <p className="text-sm text-muted">Loading…</p>}
          {!loading && businesses.length === 0 && (
            <p className="text-sm text-muted">No businesses analyzed yet.</p>
          )}
          {businesses.map((b) => (
            <div key={b.id} className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-line/70">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold text-ink">{b.name}</div>
                  <div className="text-sm text-muted">
                    {b.category}
                    {b.city ? ` · ${b.city}` : ""}
                    {b.neighborhood ? `-${b.neighborhood}` : ""}
                  </div>
                </div>
                <span className="whitespace-nowrap text-[11px] text-muted">{fmtDate(b.createdAt)}</span>
              </div>
              {b.sourceUrl && (
                <a
                  href={b.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-xs font-medium text-rausch hover:underline"
                >
                  🔗 {hostOf(b.sourceUrl)}
                </a>
              )}
              {b.styleTags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {b.styleTags.map((t) => (
                    <Tag key={t}>{t}</Tag>
                  ))}
                </div>
              )}
              {b.summary && <p className="mt-3 text-sm text-muted">{b.summary}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* creators */}
      <section className="mt-16">
        <h2 className="text-xl font-bold text-ink">Creator accounts (scraped from profile)</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {loading && <p className="text-sm text-muted">Loading…</p>}
          {!loading && creators.length === 0 && (
            <p className="text-sm text-muted">No creators analyzed yet.</p>
          )}
          {creators.map((c) => (
            <div key={c.id} className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-line/70">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {c.avatarUrl && <img src={c.avatarUrl} alt="" className="h-11 w-11 rounded-full object-cover" />}
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-ink">{c.handle}</div>
                  <div className="text-xs text-muted">
                    {c.followers.toLocaleString("en-US")} followers
                    {c.audienceCity ? ` · ${c.audienceCity}` : ""} · {c.platform}
                  </div>
                </div>
                <span className="whitespace-nowrap text-[11px] text-muted">{fmtDate(c.createdAt)}</span>
              </div>
              {c.sourceUrl && (
                <a
                  href={c.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-xs font-medium text-rausch hover:underline"
                >
                  🔗 {hostOf(c.sourceUrl)}
                </a>
              )}
              {c.topics.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {c.topics.map((t) => (
                    <Tag key={t}>#{t}</Tag>
                  ))}
                </div>
              )}
              <div className="mt-4 space-y-2">
                <Bar label="Local Audience" value={c.signals.localShare} />
                <Bar label="Engagement" value={c.signals.engagement} />
                <Bar label="Reach" value={c.signals.reach} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
