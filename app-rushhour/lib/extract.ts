// Real extraction: fetch a public page, reduce it to readable text, and let GPT
// turn it into a structured profile. Both functions degrade gracefully to a
// fixture so the demo never hard-fails on a blocked or JS-only site.
import { randomUUID } from "crypto";
import { client } from "./llm";
import { BusinessProfile, CreatorProfile, Platform } from "./types";
import businesses from "./fixtures/businesses.json";
import creators from "./fixtures/creators.json";

function clamp01(n: unknown): number {
  const v = typeof n === "number" ? n : Number(n);
  return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0;
}

function normalizeUrl(raw: string): string {
  const s = (raw || "").trim();
  return s.startsWith("http") ? s : `https://${s}`;
}

function hostOf(url: string): string {
  try { return new URL(normalizeUrl(url)).hostname.replace(/^www\./, ""); } catch { return ""; }
}

// Stable id per domain so re-scraping the same website updates the existing
// row (upsert on id) instead of creating a duplicate business.
function bizId(host: string): string {
  const slug = host.replace(/[^a-z0-9]/gi, "").toLowerCase();
  return slug ? `biz_${slug}` : bizId(host);
}

// Pull a handle out of a profile link or raw @handle.
function handleOf(link: string): string {
  const s = (link || "").trim();
  const fromUrl = s.match(/(?:instagram\.com|tiktok\.com)\/@?([A-Za-z0-9._]+)/i);
  if (fromUrl) return "@" + fromUrl[1].toLowerCase();
  const at = s.match(/@?([A-Za-z0-9._]{2,})/);
  return at ? "@" + at[1].toLowerCase() : "@unknown";
}

// Fetch a URL and strip it down to plain readable text (capped for token cost).
async function fetchReadableText(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(normalizeUrl(url), {
      signal: controller.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
        accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) return "";
    const html = await res.text();
    // Keep the og:/title meta lines, then strip everything else to text.
    const metas = Array.from(html.matchAll(/<meta[^>]+(?:property|name)=["'](?:og:[^"']+|description)["'][^>]*>/gi))
      .map((m) => m[0].replace(/<[^>]+>/g, " "))
      .join(" ");
    const title = (html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? "").trim();
    const body = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return `TITLE: ${title}\nMETA: ${metas}\nTEXT: ${body}`.slice(0, 6000);
  } catch {
    return "";
  } finally {
    clearTimeout(timer);
  }
}

const SYSTEM_BUSINESS = `You analyze the website of a local business and produce a structured brand profile.
Respond ONLY with JSON:
{"name":string,"category":string,"city":string,"neighborhood":string,"styleTags":string[],"description":string,"summary":string}
- category: short English category, e.g. "Italian Restaurant", "Gym".
- city/neighborhood: from the text; if unknown, leave empty.
- styleTags: 3-5 short English adjectives describing the brand/ambiance style, e.g. "warm","rustic","modern".
- description: one short paragraph.
- summary: 2-3 readable sentences as a profile summary.`;

export async function extractBusiness(
  url: string,
): Promise<{ profile: BusinessProfile; summary?: string; sourceUrl: string }> {
  const sourceUrl = normalizeUrl(url);
  const host = hostOf(url);
  const text = await fetchReadableText(url);
  const fallback = (businesses as BusinessProfile[])[0];
  if (!text) {
    return {
      profile: { ...fallback, id: bizId(host), description: host ? `${fallback.description} (Source: ${host})` : fallback.description },
      sourceUrl,
    };
  }
  try {
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_BUSINESS },
        { role: "user", content: `Website: ${host}\n\n${text}` },
      ],
    });
    const p = JSON.parse(res.choices[0].message.content || "{}");
    const profile: BusinessProfile = {
      id: bizId(host),
      name: String(p.name || fallback.name),
      category: String(p.category || fallback.category),
      city: String(p.city || fallback.city),
      neighborhood: p.neighborhood ? String(p.neighborhood) : undefined,
      styleTags: Array.isArray(p.styleTags) && p.styleTags.length ? p.styleTags.map(String) : fallback.styleTags,
      description: String(p.description || fallback.description),
    };
    return { profile, summary: p.summary ? String(p.summary) : undefined, sourceUrl };
  } catch {
    return { profile: { ...fallback, id: bizId(host) }, sourceUrl };
  }
}

const SYSTEM_CREATOR = `You analyze the public profile of a content creator (bio + 1-2 videos/posts) and produce a structured profile.
If real numbers are missing, ESTIMATE plausibly from the bio, topics and style. Do not invent exact facts, but give reasoned estimates.
Respond ONLY with JSON:
{"platform":"instagram"|"tiktok","followers":number,"topics":string[],"styleTags":string[],"audienceCity":string,"engagementRate":number,"localShare":number,"engagement":number,"reach":number,"summary":string}
- followers: whole number (estimate is fine).
- topics: 2-4 short English keywords, e.g. "food","local".
- styleTags: 2-4 short English style adjectives.
- audienceCity: the presumed main city of the audience.
- engagementRate: 0..1 (e.g. 0.05).
- localShare/engagement/reach: each normalized 0..1 (local share, engagement quality, reach scale).
- summary: 2-3 readable sentences.`;

export async function extractCreator(
  link: string,
): Promise<{ profile: CreatorProfile; summary?: string; sourceUrl: string }> {
  const sourceUrl = normalizeUrl(link);
  const handle = handleOf(link);
  const text = await fetchReadableText(link);
  const all = creators as CreatorProfile[];
  const fallback = all.find((c) => handle.includes(c.handle.replace("@", ""))) ?? all[0];
  if (!text) {
    return { profile: { ...fallback, id: `cr_${randomUUID().slice(0, 8)}`, handle }, sourceUrl };
  }
  try {
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_CREATOR },
        { role: "user", content: `Handle: ${handle}\n\n${text}` },
      ],
    });
    const p = JSON.parse(res.choices[0].message.content || "{}");
    const platform: Platform = p.platform === "tiktok" ? "tiktok" : "instagram";
    const profile: CreatorProfile = {
      id: `cr_${randomUUID().slice(0, 8)}`,
      handle,
      platform,
      followers: Number.isFinite(Number(p.followers)) ? Math.max(0, Math.round(Number(p.followers))) : fallback.followers,
      avatarUrl: fallback.avatarUrl,
      coverUrl: fallback.coverUrl,
      topics: Array.isArray(p.topics) && p.topics.length ? p.topics.map(String) : fallback.topics,
      styleTags: Array.isArray(p.styleTags) && p.styleTags.length ? p.styleTags.map(String) : fallback.styleTags,
      audienceCity: String(p.audienceCity || fallback.audienceCity),
      engagementRate: clamp01(p.engagementRate) || fallback.engagementRate,
      signals: {
        localShare: clamp01(p.localShare),
        engagement: clamp01(p.engagement),
        reach: clamp01(p.reach),
      },
    };
    return { profile, summary: p.summary ? String(p.summary) : undefined, sourceUrl };
  } catch {
    return { profile: { ...fallback, id: `cr_${randomUUID().slice(0, 8)}`, handle }, sourceUrl };
  }
}
