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
