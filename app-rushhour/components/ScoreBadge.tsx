import { TrafficLight } from "@/lib/types";

const STAR: Record<TrafficLight, string> = {
  green: "text-emerald-500",
  yellow: "text-amber-400",
  red: "text-rose-500",
};

const LABEL: Record<TrafficLight, string> = {
  green: "Top-Match",
  yellow: "Solider Match",
  red: "Schwacher Match",
};

export function ScoreBadge({
  score,
  light,
  size = "sm",
}: {
  score: number;
  light: TrafficLight;
  size?: "sm" | "lg";
}) {
  const lg = size === "lg";
  return (
    <div
      title={LABEL[light]}
      className={`inline-flex items-center gap-1.5 rounded-full bg-white font-semibold tabular-nums text-ink shadow-pill ${
        lg ? "px-3.5 py-2 text-base" : "px-3 py-1.5 text-sm"
      }`}
    >
      <span className={`${STAR[light]} ${lg ? "text-lg" : "text-base"} leading-none`}>★</span>
      {score}
    </div>
  );
}
