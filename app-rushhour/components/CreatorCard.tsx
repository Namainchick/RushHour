"use client";
import { MatchResult } from "@/lib/types";
import { ScoreBadge } from "./ScoreBadge";
import { SignalBar } from "./SignalBar";

const PLATFORM_LABEL: Record<string, string> = { instagram: "Instagram", tiktok: "TikTok" };

export function CreatorCard({ result, onClick }: { result: MatchResult; onClick: () => void }) {
  const { creator } = result;
  const local = result.contributions.find((c) => c.key === "localAudience");
  return (
    <button
      onClick={onClick}
      className="group flex w-full flex-col overflow-hidden rounded-2xl bg-white text-left ring-1 ring-line/70 transition duration-300 hover:-translate-y-1 hover:shadow-card focus:outline-none focus-visible:ring-2 focus-visible:ring-rausch"
    >
      {/* Cover */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-cloud">
        {creator.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={creator.coverUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/20 to-transparent" />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-ink backdrop-blur">
          {PLATFORM_LABEL[creator.platform] ?? creator.platform}
        </span>
        <div className="absolute right-3 top-3">
          <ScoreBadge score={result.score} light={result.light} />
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={creator.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover ring-2 ring-white" />
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold text-ink">{creator.handle}</div>
            <div className="truncate text-xs text-muted">
              {creator.followers.toLocaleString("en-US")} followers · {creator.audienceCity}
            </div>
          </div>
        </div>

        {local && (
          <div className="mt-4">
            <SignalBar label={local.label} value={local.value} />
          </div>
        )}

        <p className="mt-3 line-clamp-2 text-sm text-muted">{result.shortReason}</p>

        <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-rausch">
          View details
          <span className="transition-transform duration-300 group-hover:translate-x-0.5">→</span>
        </span>
      </div>
    </button>
  );
}
