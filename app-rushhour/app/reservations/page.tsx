"use client";
import Link from "next/link";
import { useReservations, removeReservation, type Reservation } from "@/lib/reservations";

function StatusPill({ status }: { status: Reservation["status"] }) {
  const map = {
    angefragt: { label: "Requested", cls: "bg-amber-100 text-amber-700" },
    bestaetigt: { label: "Confirmed", cls: "bg-emerald-100 text-emerald-700" },
  } as const;
  const s = map[status];
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${s.cls}`}>{s.label}</span>;
}

export default function ReservationsPage() {
  const reservations = useReservations();

  return (
    <main className="mx-auto max-w-4xl px-5 pt-10 pb-24">
      <h1 className="text-3xl font-bold text-ink">Your reservations</h1>
      <p className="mt-1 text-muted">Creator collaborations you've requested.</p>

      {reservations.length === 0 ? (
        <div className="mt-12 flex flex-col items-center rounded-3xl bg-cloud px-6 py-16 text-center">
          <span className="text-5xl">🤝</span>
          <h2 className="mt-4 text-xl font-semibold text-ink">No reservations yet</h2>
          <p className="mt-1 max-w-sm text-muted">
            Find the right creators and request your first collaboration — it will show up here.
          </p>
          <Link
            href="/"
            className="mt-6 rounded-xl bg-rausch px-6 py-3 font-semibold text-white transition hover:bg-rausch-dark"
          >
            Find matches
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {reservations.map((r) => (
            <div
              key={r.creatorId}
              className="flex flex-col gap-4 overflow-hidden rounded-2xl bg-white ring-1 ring-line/70 transition hover:shadow-card sm:flex-row"
            >
              <Link href={`/creators/${r.creatorId}`} className="block sm:w-56 sm:shrink-0">
                <div className="aspect-[16/10] w-full overflow-hidden bg-cloud sm:h-full">
                  {r.coverUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.coverUrl} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
              </Link>

              <div className="flex flex-1 flex-col p-4 sm:py-5 sm:pr-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                    <div>
                      <Link href={`/creators/${r.creatorId}`} className="font-semibold text-ink hover:underline">
                        {r.handle}
                      </Link>
                      <div className="text-xs text-muted">{r.city}</div>
                    </div>
                  </div>
                  <StatusPill status={r.status} />
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
                  {typeof r.score === "number" && (
                    <span>
                      Match score <span className="font-semibold text-ink">{r.score}/100</span>
                    </span>
                  )}
                  {typeof r.priceFrom === "number" && (
                    <span>
                      from <span className="font-semibold text-ink">€{r.priceFrom.toLocaleString("en-US")}</span>
                    </span>
                  )}
                  <span>Requested on {r.createdAtLabel}</span>
                </div>

                <div className="mt-auto flex items-center gap-3 pt-4">
                  <Link
                    href={`/creators/${r.creatorId}`}
                    className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    View profile
                  </Link>
                  <button
                    onClick={() => removeReservation(r.creatorId)}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-muted transition hover:text-rausch"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
