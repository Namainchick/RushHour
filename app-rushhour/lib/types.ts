// lib/types.ts — SHARED CONTRACT between frontend and backend.
// Do not edit without updating both build plans (docs/build/frontend-plan.md, backend-plan.md).

export type Platform = "instagram" | "tiktok";

export type BusinessProfile = {
  id: string;
  name: string;
  category: string;       // e.g. "Italienisches Restaurant"
  city: string;           // e.g. "Hamburg"
  neighborhood?: string;  // e.g. "Eppendorf"
  styleTags: string[];    // e.g. ["warm", "rustikal", "familiär"]
  description: string;    // one short paragraph
};

export type CreatorSignals = {
  localShare: number;   // 0..1 share of audience in creator.audienceCity
  engagement: number;   // 0..1 normalized real engagement quality
  reach: number;        // 0..1 log-normalized follower scale
};

export type CreatorProfile = {
  id: string;
  handle: string;          // "@lisa_hamburg_eats"
  platform: Platform;
  followers: number;       // raw count for display
  avatarUrl: string;       // placeholder URL is fine
  coverUrl?: string;       // 16:9 content/cover photo for the listing card
  topics: string[];        // ["food", "local", "lifestyle"]
  styleTags: string[];     // ["warm", "authentisch"]
  audienceCity: string;    // "Hamburg"
  engagementRate: number;  // 0..1 for display, e.g. 0.082
  signals: CreatorSignals;
};

// The four weighting dimensions the goal maps onto.
export type Weights = {
  localAudience: number; // 0..1
  engagement: number;    // 0..1
  styleMatch: number;    // 0..1
  reach: number;         // 0..1
};

export type TrafficLight = "green" | "yellow" | "red";

export type FeatureContribution = {
  key: keyof Weights;
  label: string;   // UI label, e.g. "Local Audience"
  value: number;   // 0..1 feature value for this creator+business
  weight: number;  // 0..1 applied weight
};

export type MatchResult = {
  creator: CreatorProfile;
  score: number;            // 0..100
  light: TrafficLight;
  shortReason: string;      // one line for the card (instant, templated)
  contributions: FeatureContribution[];
};

export type MatchResponse = {
  weights: Weights;
  results: MatchResult[];   // sorted by score desc
};

// What the extract-* API routes return: the structured profile plus the raw
// scrape artifacts (AI summary + source URL) so the UI can show what was read.
export type ExtractBusinessResult = {
  profile: BusinessProfile;
  summary?: string;
  sourceUrl?: string;
};

export type ExtractCreatorResult = {
  profile: CreatorProfile;
  summary?: string;
  sourceUrl?: string;
};

export type GoalPreset = { id: string; label: string };

export const GOAL_PRESETS: GoalPreset[] = [
  { id: "local_traffic", label: "More guests from the neighborhood" },
  { id: "city_awareness", label: "Get known across the city" },
  { id: "premium_image", label: "Build a premium image" },
];
