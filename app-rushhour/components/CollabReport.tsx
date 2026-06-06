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
