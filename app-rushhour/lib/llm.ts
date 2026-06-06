import OpenAI from "openai";
import { Weights, BusinessProfile, MatchResult } from "./types";

export const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Fixed weight profiles for the three UI presets (instant, no LLM call).
const PRESET_WEIGHTS: Record<string, Weights> = {
  local_traffic:  { localAudience: 0.9, engagement: 0.8, styleMatch: 0.4, reach: 0.1 },
  city_awareness: { localAudience: 0.2, engagement: 0.5, styleMatch: 0.4, reach: 0.9 },
  premium_image:  { localAudience: 0.3, engagement: 0.6, styleMatch: 0.9, reach: 0.4 },
};

function clamp01(n: unknown): number {
  const v = typeof n === "number" ? n : 0;
  return Math.max(0, Math.min(1, v));
}

function normalizeWeights(raw: Record<string, unknown> | null): Weights {
  return {
    localAudience: clamp01(raw?.localAudience),
    engagement: clamp01(raw?.engagement),
    styleMatch: clamp01(raw?.styleMatch),
    reach: clamp01(raw?.reach),
  };
}

const SYSTEM_WEIGHTS = `You are the matching engine of a platform that connects local businesses with content creators.
The user describes their marketing goal. Translate the goal into weights (each 0.0 to 1.0) for these four signals:
- localAudience: how important it is that the audience lives locally near the business.
- engagement: how important real, high engagement is (rather than just reach).
- styleMatch: how important it is that the creator's visual/brand style matches the business.
- reach: how important pure reach / high follower count is.
Respond ONLY with JSON: {"localAudience":number,"engagement":number,"styleMatch":number,"reach":number}.
Example "more walk-in customers from the neighborhood": {"localAudience":0.9,"engagement":0.8,"styleMatch":0.4,"reach":0.1}.
Example "become known nationwide": {"localAudience":0.1,"engagement":0.4,"styleMatch":0.4,"reach":0.95}.`;

export async function goalToWeights(goalText: string, presetId?: string): Promise<Weights> {
  if (presetId && PRESET_WEIGHTS[presetId]) return PRESET_WEIGHTS[presetId];
  try {
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_WEIGHTS },
        { role: "user", content: goalText || "more guests from the neighborhood" },
      ],
    });
    return normalizeWeights(JSON.parse(res.choices[0].message.content || "{}"));
  } catch {
    return PRESET_WEIGHTS.local_traffic; // safe fallback so the demo never breaks
  }
}

export async function generateReport(
  biz: BusinessProfile,
  result: MatchResult,
  _weights: Weights,
): Promise<string[]> {
  const facts = result.contributions
    .map((c) => `${c.label}: value ${(c.value * 100).toFixed(0)}%, importance ${(c.weight * 100).toFixed(0)}%`)
    .join("; ");
  const prompt = `Business: ${biz.name} (${biz.category}, ${biz.city}). Goal weights and creator values: ${facts}.
Creator: ${result.creator.handle}, ${result.creator.followers} followers, engagement ${(result.creator.engagementRate * 100).toFixed(1)}%, audience in ${result.creator.audienceCity}.
Score: ${result.score}/100.
Write 3 short, concrete English bullet points explaining why this creator fits the business's goal (or not). Cite numbers. No marketing fluff.
Respond ONLY with JSON: {"bullets": ["...","...","..."]}.`;
  try {
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    });
    const parsed = JSON.parse(res.choices[0].message.content || "{}");
    return Array.isArray(parsed.bullets) ? parsed.bullets.slice(0, 3) : [];
  } catch {
    return [result.shortReason];
  }
}
