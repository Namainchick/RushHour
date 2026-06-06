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
