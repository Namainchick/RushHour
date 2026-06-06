// Maps between Supabase rows (snake_case, flat signals) and the shared types
// (camelCase, nested signals). The matcher and frontend only ever see the types.
import { supabase } from "./supabase";
import { BusinessProfile, CreatorProfile } from "./types";

type CreatorRow = {
  id: string;
  handle: string;
  platform: string;
  followers: number;
  avatar_url: string | null;
  cover_url: string | null;
  topics: string[] | null;
  style_tags: string[] | null;
  audience_city: string | null;
  engagement_rate: number;
  local_share: number;
  engagement: number;
  reach: number;
};

function rowToCreator(r: CreatorRow): CreatorProfile {
  return {
    id: r.id,
    handle: r.handle,
    platform: r.platform === "tiktok" ? "tiktok" : "instagram",
    followers: r.followers ?? 0,
    avatarUrl: r.avatar_url ?? "",
    coverUrl: r.cover_url ?? undefined,
    topics: r.topics ?? [],
    styleTags: r.style_tags ?? [],
    audienceCity: r.audience_city ?? "",
    engagementRate: r.engagement_rate ?? 0,
    signals: {
      localShare: r.local_share ?? 0,
      engagement: r.engagement ?? 0,
      reach: r.reach ?? 0,
    },
  };
}

export async function getAllCreators(): Promise<CreatorProfile[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("creators")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`getAllCreators: ${error.message}`);
  return (data as CreatorRow[]).map(rowToCreator);
}

export async function saveCreator(
  c: CreatorProfile,
  meta: { sourceUrl?: string; summary?: string } = {},
): Promise<CreatorProfile> {
  if (!supabase) return c;
  const row = {
    id: c.id,
    handle: c.handle,
    platform: c.platform,
    followers: c.followers,
    avatar_url: c.avatarUrl,
    cover_url: c.coverUrl ?? null,
    topics: c.topics,
    style_tags: c.styleTags,
    audience_city: c.audienceCity,
    engagement_rate: c.engagementRate,
    local_share: c.signals.localShare,
    engagement: c.signals.engagement,
    reach: c.signals.reach,
    profile_summary: meta.summary ?? null,
    source_url: meta.sourceUrl ?? null,
  };
  // Upsert on handle so re-analysing the same creator refreshes instead of duplicating.
  const { data, error } = await supabase
    .from("creators")
    .upsert(row, { onConflict: "handle" })
    .select("*")
    .single();
  if (error) throw new Error(`saveCreator: ${error.message}`);
  return rowToCreator(data as CreatorRow);
}

export async function saveBusiness(
  b: BusinessProfile,
  meta: { sourceUrl?: string; summary?: string } = {},
): Promise<BusinessProfile> {
  if (!supabase) return b;
  const row = {
    id: b.id,
    name: b.name,
    category: b.category,
    city: b.city,
    neighborhood: b.neighborhood ?? null,
    style_tags: b.styleTags,
    description: b.description,
    profile_summary: meta.summary ?? null,
    source_url: meta.sourceUrl ?? null,
  };
  const { error } = await supabase.from("businesses").upsert(row, { onConflict: "id" });
  if (error) throw new Error(`saveBusiness: ${error.message}`);
  return b;
}

// ---- Overview (for the "what we scraped" demo page) ----

export type BusinessOverview = {
  id: string;
  name: string;
  category: string | null;
  city: string | null;
  neighborhood: string | null;
  styleTags: string[];
  sourceUrl: string | null;
  summary: string | null;
  createdAt: string;
};

export type CreatorOverview = {
  id: string;
  handle: string;
  platform: string;
  followers: number;
  avatarUrl: string | null;
  audienceCity: string | null;
  topics: string[];
  styleTags: string[];
  sourceUrl: string | null;
  summary: string | null;
  createdAt: string;
  signals: { localShare: number; engagement: number; reach: number };
};

export async function getBusinessesOverview(): Promise<BusinessOverview[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("businesses")
    .select("id,name,category,city,neighborhood,style_tags,source_url,profile_summary,created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`getBusinessesOverview: ${error.message}`);
  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    name: r.name as string,
    category: (r.category as string) ?? null,
    city: (r.city as string) ?? null,
    neighborhood: (r.neighborhood as string) ?? null,
    styleTags: (r.style_tags as string[]) ?? [],
    sourceUrl: (r.source_url as string) ?? null,
    summary: (r.profile_summary as string) ?? null,
    createdAt: r.created_at as string,
  }));
}

export async function getCreatorsOverview(): Promise<CreatorOverview[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("creators")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`getCreatorsOverview: ${error.message}`);
  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    handle: r.handle as string,
    platform: (r.platform as string) ?? "instagram",
    followers: (r.followers as number) ?? 0,
    avatarUrl: (r.avatar_url as string) ?? null,
    audienceCity: (r.audience_city as string) ?? null,
    topics: (r.topics as string[]) ?? [],
    styleTags: (r.style_tags as string[]) ?? [],
    sourceUrl: (r.source_url as string) ?? null,
    summary: (r.profile_summary as string) ?? null,
    createdAt: r.created_at as string,
    signals: {
      localShare: (r.local_share as number) ?? 0,
      engagement: (r.engagement as number) ?? 0,
      reach: (r.reach as number) ?? 0,
    },
  }));
}
