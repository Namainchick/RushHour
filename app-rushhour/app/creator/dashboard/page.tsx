"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import creatorsData from "@/lib/fixtures/creators.json";
import { CreatorProfile } from "@/lib/types";
import {
  CREATOR_REQUESTS,
  VISIBILITY,
  type CreatorRequest,
  type RequestStatus,
} from "@/lib/creator-dashboard-mock";

const me = (creatorsData as CreatorProfile[]).find((c) => c.id === "cr_lisa")!;

const STATUS_META: Record<RequestStatus, { label: string; cls: string }> = {
  neu: { label: "New", cls: "bg-rausch/10 text-rausch" },
  angenommen: { label: "Accepted", cls: "bg-sky-100 text-sky-700" },
  geplant: { label: "Scheduled", cls: "bg-amber-100 text-amber-700" },
  abgeschlossen: { label: "Completed", cls: "bg-emerald-100 text-emerald-700" },
};

const STATUS_ORDER: RequestStatus[] = ["neu", "angenommen", "geplant", "abgeschlossen"];

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TODAY = 6; // 6. Juni 2026 (Demo-Datum)

function StatCard({ value, label, delta }: { value: string; label: string; delta?: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-line/70">
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-ink">{value}</span>
        {delta && <span className="text-sm font-semibold text-emerald-600">{delta}</span>}
      </div>
      <div className="mt-1 text-sm text-muted">{label}</div>
    </div>
  );
}

export default function CreatorDashboard() {
  const [requests, setRequests] = useState<CreatorRequest[]>(CREATOR_REQUESTS);

  function accept(id: string) {
    setRequests((rs) => rs.map((r) => (r.id === id ? { ...r, status: "angenommen" } : r)));
  }
  function decline(id: string) {
    setRequests((rs) => rs.filter((r) => r.id !== id));
  }

  const grouped = useMemo(() => {
    const g: Record<RequestStatus, CreatorRequest[]> = { neu: [], angenommen: [], geplant: [], abgeschlossen: [] };
    for (const r of requests) g[r.status].push(r);
    return g;
  }, [requests]);

  // June 2026: 30 days, starts on a Monday → no leading blanks.
  const firstWeekday = (new Date(2026, 5, 1).getDay() + 6) % 7;
  const bookedDays = useMemo(() => {
    const m = new Map<number, CreatorRequest>();
    for (const r of requests) if (r.day) m.set(r.day, r);
    return m;
  }, [requests]);

  const newCount = grouped.neu.length;

  return (
    <main className="mx-auto max-w-6xl px-5 pt-10 pb-24">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={me.avatarUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-ink sm:text-3xl">Hi, {me.handle}</h1>
          <p className="text-muted">
            {newCount > 0 ? `You have ${newCount} new request${newCount > 1 ? "s" : ""}.` : "No new requests."}
          </p>
        </div>
        <Link href={`/creators/${me.id}`} className="rounded-xl px-4 py-2 text-sm font-semibold text-rausch hover:underline">
          View profile →
        </Link>
      </div>

      {/* Visibility — honest platform counts */}
      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Who's watching you</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <StatCard value={String(VISIBILITY.profileViews)} label="Profile views this week" delta={`+${VISIBILITY.profileViewsDeltaPct}%`} />
          <StatCard value={String(VISIBILITY.savedBy)} label="Businesses saved you" />
          <StatCard value={String(VISIBILITY.inMatchLists)} label="Appearances in match lists" />
        </div>
      </section>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
        {/* Pipeline */}
        <section>
          <h2 className="text-xl font-bold text-ink">Requests pipeline</h2>
          <div className="mt-4 space-y-6">
            {STATUS_ORDER.map((status) => {
              const items = grouped[status];
              if (items.length === 0) return null;
              return (
                <div key={status}>
                  <div className="mb-2 flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_META[status].cls}`}>
                      {STATUS_META[status].label}
                    </span>
                    <span className="text-sm text-muted">{items.length}</span>
                  </div>
                  <div className="space-y-3">
                    {items.map((r) => (
                      <div key={r.id} className="flex flex-wrap items-center gap-4 rounded-2xl bg-white p-4 ring-1 ring-line/70">
                        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-lg font-bold ${r.tint}`}>
                          {r.initial}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-ink">{r.business}</div>
                          <div className="truncate text-xs text-muted">
                            {r.category} · {r.city}
                          </div>
                          <div className="mt-1 text-xs text-muted">
                            {r.deliverable} · €{r.budget.toLocaleString("en-US")}
                            {r.day ? ` · 0${r.day}.06.` : ""}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-full bg-cloud px-2.5 py-1 text-xs font-semibold text-ink">
                          <span className="text-rausch">★</span> {r.matchScore}
                        </div>
                        {r.status === "neu" && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => accept(r.id)}
                              className="rounded-lg bg-rausch px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-rausch-dark"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => decline(r.id)}
                              className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition hover:text-rausch"
                            >
                              Decline
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Calendar */}
        <aside>
          <h2 className="text-xl font-bold text-ink">Schedule</h2>
          <div className="mt-4 rounded-3xl bg-white p-5 shadow-card ring-1 ring-line/70">
            <div className="mb-3 text-center font-semibold text-ink">June 2026</div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted">
              {WEEKDAYS.map((d) => (
                <div key={d} className="py-1">
                  {d}
                </div>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {Array.from({ length: firstWeekday }).map((_, i) => (
                <div key={`b${i}`} />
              ))}
              {Array.from({ length: 30 }).map((_, i) => {
                const day = i + 1;
                const booked = bookedDays.get(day);
                const isToday = day === TODAY;
                const done = booked?.status === "abgeschlossen";
                return (
                  <div
                    key={day}
                    title={booked ? `${booked.business} · ${booked.deliverable}` : undefined}
                    className={`relative grid aspect-square place-items-center rounded-lg text-sm ${
                      booked && !done ? "bg-rausch text-white font-semibold" : "text-ink"
                    } ${done ? "bg-cloud text-muted" : ""} ${isToday && !booked ? "ring-2 ring-rausch" : ""}`}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 space-y-1.5 border-t border-line/70 pt-4 text-xs text-muted">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-rausch" /> Booked collaboration
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded ring-2 ring-rausch" /> Today
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
