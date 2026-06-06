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

const SYSTEM_WEIGHTS = `Du bist die Matching-Engine einer Plattform, die lokale Geschäfte mit Content-Creators verbindet.
Der Nutzer beschreibt sein Marketing-Ziel. Übersetze das Ziel in Gewichte (jeweils 0.0 bis 1.0) für diese vier Signale:
- localAudience: wie wichtig ist eine Zielgruppe, die lokal in der Nähe des Geschäfts wohnt.
- engagement: wie wichtig ist echtes, hohes Engagement (statt nur Reichweite).
- styleMatch: wie wichtig ist, dass der Bild-/Markenstil des Creators zum Geschäft passt.
- reach: wie wichtig ist reine Reichweite / hohe Follower-Zahl.
Antworte NUR mit JSON: {"localAudience":number,"engagement":number,"styleMatch":number,"reach":number}.
Beispiel "mehr Laufkundschaft aus der Nachbarschaft": {"localAudience":0.9,"engagement":0.8,"styleMatch":0.4,"reach":0.1}.
Beispiel "deutschlandweit bekannt werden": {"localAudience":0.1,"engagement":0.4,"styleMatch":0.4,"reach":0.95}.`;

export async function goalToWeights(goalText: string, presetId?: string): Promise<Weights> {
  if (presetId && PRESET_WEIGHTS[presetId]) return PRESET_WEIGHTS[presetId];
  try {
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_WEIGHTS },
        { role: "user", content: goalText || "mehr Gäste aus der Nachbarschaft" },
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
    .map((c) => `${c.label}: Wert ${(c.value * 100).toFixed(0)}%, Wichtigkeit ${(c.weight * 100).toFixed(0)}%`)
    .join("; ");
  const prompt = `Geschäft: ${biz.name} (${biz.category}, ${biz.city}). Ziel-Gewichte und Creator-Werte: ${facts}.
Creator: ${result.creator.handle}, ${result.creator.followers} Follower, Engagement ${(result.creator.engagementRate * 100).toFixed(1)}%, Zielgruppe in ${result.creator.audienceCity}.
Score: ${result.score}/100.
Schreibe 3 kurze, konkrete deutsche Stichpunkte, warum dieser Creator zum Ziel des Geschäfts passt (oder nicht). Nenne Zahlen. Kein Marketing-Geschwurbel.
Antworte NUR mit JSON: {"bullets": ["...","...","..."]}.`;
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
