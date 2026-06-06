import { NextResponse } from "next/server";
import businesses from "@/lib/fixtures/businesses.json";
import { BusinessProfile } from "@/lib/types";

// TODO: später echte Website-Analyse (Crawl + LLM). Für die Demo gemockt.
export async function POST(req: Request) {
  const { url } = await req.json().catch(() => ({ url: "" }));
  const biz = (businesses as BusinessProfile[])[0];
  // Reflect the typed URL into the name so the demo feels live.
  const host = (() => { try { return new URL(url.startsWith("http") ? url : `https://${url}`).hostname; } catch { return ""; } })();
  return NextResponse.json({ ...biz, description: host ? `${biz.description} (Quelle: ${host})` : biz.description });
}
