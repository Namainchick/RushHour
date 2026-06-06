import { NextResponse } from "next/server";
import { extractBusiness } from "@/lib/extract";
import { saveBusiness } from "@/lib/db";

// Fetches the real website, extracts a brand profile via GPT, and persists it.
// Degrades to a fixture inside extractBusiness() if the site can't be read.
export async function POST(req: Request) {
  const { url } = await req.json().catch(() => ({ url: "" }));
  const { profile, summary, sourceUrl } = await extractBusiness(String(url || ""));
  try {
    await saveBusiness(profile, { sourceUrl, summary });
  } catch {
    // Persisting is best-effort; never block the demo on a DB hiccup.
  }
  return NextResponse.json({ profile, summary, sourceUrl });
}
