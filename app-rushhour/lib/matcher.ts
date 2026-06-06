import {
  BusinessProfile, CreatorProfile, Weights, MatchResult,
  FeatureContribution, TrafficLight,
} from "./types";

function jaccard(a: string[], b: string[]): number {
  const A = new Set(a.map((s) => s.toLowerCase()));
  const B = new Set(b.map((s) => s.toLowerCase()));
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  const union = new Set([...A, ...B]).size;
  return inter / union;
}

const LABELS: Record<keyof Weights, string> = {
  localAudience: "Local Audience",
  engagement: "Real Engagement",
  styleMatch: "Style Match",
  reach: "Reach",
};

const PHRASES: Record<keyof Weights, string> = {
  localAudience: "strong local audience",
  engagement: "high real engagement",
  styleMatch: "matches the brand style",
  reach: "large reach",
};

export function computeFeatures(biz: BusinessProfile, c: CreatorProfile): Record<keyof Weights, number> {
  const sameCity = c.audienceCity.toLowerCase() === biz.city.toLowerCase();
  return {
    localAudience: sameCity ? c.signals.localShare : c.signals.localShare * 0.15,
    engagement: c.signals.engagement,
    styleMatch: jaccard(c.styleTags, biz.styleTags),
    reach: c.signals.reach,
  };
}

function buildShortReason(contribs: FeatureContribution[]): string {
  const ranked = [...contribs].sort((a, b) => b.weight * b.value - a.weight * a.value);
  const top = ranked.slice(0, 2).filter((c) => c.weight * c.value > 0.05);
  if (top.length === 0) return "Solid all-round match.";
  const text = top.map((c) => PHRASES[c.key]).join(", ");
  return text.charAt(0).toUpperCase() + text.slice(1) + ".";
}

export function scoreCreator(biz: BusinessProfile, c: CreatorProfile, w: Weights): MatchResult {
  const f = computeFeatures(biz, c);
  const keys = Object.keys(LABELS) as (keyof Weights)[];
  const totalW = keys.reduce((s, k) => s + w[k], 0) || 1;
  const raw = keys.reduce((s, k) => s + w[k] * f[k], 0);
  const score = Math.round((raw / totalW) * 100);
  const light: TrafficLight = score >= 75 ? "green" : score >= 50 ? "yellow" : "red";
  const contributions: FeatureContribution[] = keys.map((k) => ({
    key: k, label: LABELS[k], value: f[k], weight: w[k],
  }));
  return { creator: c, score, light, shortReason: buildShortReason(contributions), contributions };
}

export function rankCreators(biz: BusinessProfile, creators: CreatorProfile[], w: Weights): MatchResult[] {
  return creators.map((c) => scoreCreator(biz, c, w)).sort((a, b) => b.score - a.score);
}
