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

const SYSTEM_BUSINESS = `Du analysierst die Website eines lokalen Geschäfts und erzeugst ein strukturiertes Markenprofil.
Antworte NUR mit JSON:
{"name":string,"category":string,"city":string,"neighborhood":string,"styleTags":string[],"description":string,"summary":string}
- category: kurze deutsche Kategorie, z.B. "Italienisches Restaurant", "Fitnessstudio".
- city/neighborhood: aus dem Text; wenn unbekannt, leer.
- styleTags: 3-5 kurze deutsche Adjektive zum Marken-/Ambiente-Stil, z.B. "warm","rustikal","modern".
- description: ein kurzer Absatz.
- summary: 2-3 lesbare Sätze als Profil-Zusammenfassung.`;

export async function extractBusiness(
  url: string,
): Promise<{ profile: BusinessProfile; summary?: string; sourceUrl: string }> {
  const sourceUrl = normalizeUrl(url);
  const host = hostOf(url);
  const text = await fetchReadableText(url);
  const fallback = (businesses as BusinessProfile[])[0];
  if (!text) {
    return {
      profile: { ...fallback, id: bizId(host), description: host ? `${fallback.description} (Quelle: ${host})` : fallback.description },
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

const SYSTEM_CREATOR = `Du analysierst das öffentliche Profil eines Content-Creators (Bio + 1-2 Videos/Posts) und erzeugst ein strukturiertes Profil.
Wenn echte Zahlen fehlen, SCHÄTZE plausibel aus Bio, Themen und Stil. Erfinde keine exakten Fakten, aber gib begründete Schätzungen.
Antworte NUR mit JSON:
{"platform":"instagram"|"tiktok","followers":number,"topics":string[],"styleTags":string[],"audienceCity":string,"engagementRate":number,"localShare":number,"engagement":number,"reach":number,"summary":string}
- followers: ganze Zahl (Schätzung ok).
- topics: 2-4 kurze englische/deutsche Schlagworte, z.B. "food","local".
- styleTags: 2-4 kurze deutsche Stil-Adjektive.
- audienceCity: vermutete Hauptstadt der Zielgruppe.
- engagementRate: 0..1 (z.B. 0.05).
- localShare/engagement/reach: jeweils 0..1 normalisiert (lokaler Anteil, Engagement-Qualität, Reichweiten-Skala).
- summary: 2-3 lesbare Sätze.`;

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
