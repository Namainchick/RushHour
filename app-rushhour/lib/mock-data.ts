import { BusinessProfile, CreatorProfile, MatchResponse, MatchResult } from "./types";

export const MOCK_BUSINESS: BusinessProfile = {
  id: "biz_trattoria", name: "Trattoria Bella", category: "Italienisches Restaurant",
  city: "Hamburg", neighborhood: "Eppendorf",
  styleTags: ["warm", "rustikal", "authentisch"],
  description: "Familiengeführtes italienisches Restaurant in Hamburg-Eppendorf.",
};

export const MOCK_CREATOR: CreatorProfile = {
  id: "cr_lisa", handle: "@lisa_hamburg_eats", platform: "instagram", followers: 8400,
  avatarUrl: "https://i.pravatar.cc/150?img=47",
  coverUrl: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80&auto=format&fit=crop",
  topics: ["food", "local", "lifestyle"],
  styleTags: ["warm", "authentisch", "cozy"], audienceCity: "Hamburg", engagementRate: 0.082,
  signals: { localShare: 0.71, engagement: 0.9, reach: 0.25 },
};

const lisa: CreatorProfile = MOCK_CREATOR;
const foodie: CreatorProfile = {
  id: "cr_foodie_de", handle: "@foodie_germany", platform: "instagram", followers: 210000,
  avatarUrl: "https://i.pravatar.cc/150?img=12",
  coverUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80&auto=format&fit=crop",
  topics: ["food", "travel"], styleTags: ["clean", "modern"],
  audienceCity: "Berlin", engagementRate: 0.018, signals: { localShare: 0.08, engagement: 0.4, reach: 0.95 },
};

function r(creator: CreatorProfile, score: number, light: MatchResult["light"], shortReason: string): MatchResult {
  return { creator, score, light, shortReason, contributions: [
    { key: "localAudience", label: "Lokale Zielgruppe", value: creator.signals.localShare, weight: 0.9 },
    { key: "engagement", label: "Echtes Engagement", value: creator.signals.engagement, weight: 0.8 },
    { key: "styleMatch", label: "Stil-Match", value: 0.5, weight: 0.4 },
    { key: "reach", label: "Reichweite", value: creator.signals.reach, weight: 0.1 },
  ]};
}

export function mockMatch(presetId?: string): MatchResponse {
  if (presetId === "city_awareness") {
    return { weights: { localAudience: 0.2, engagement: 0.5, styleMatch: 0.4, reach: 0.9 },
      results: [ r(foodie, 88, "green", "Große Reichweite, modern."), r(lisa, 54, "yellow", "Starke lokale Zielgruppe, hohes echtes Engagement.") ] };
  }
  return { weights: { localAudience: 0.9, engagement: 0.8, styleMatch: 0.4, reach: 0.1 },
    results: [ r(lisa, 92, "green", "Starke lokale Zielgruppe, hohes echtes Engagement."), r(foodie, 61, "yellow", "Große Reichweite, aber bundesweit.") ] };
}

export function mockReport(result: MatchResult): string[] {
  return [
    `${Math.round(result.creator.signals.localShare * 100)}% der Follower wohnen in ${result.creator.audienceCity}`,
    `Engagement ${(result.creator.engagementRate * 100).toFixed(1)}% — deutlich über dem Influencer-Schnitt`,
    "Bildstil passt zum warmen, rustikalen Look des Restaurants",
  ];
}
