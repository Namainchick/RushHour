import { NextResponse } from "next/server";
import { extractCreator } from "@/lib/extract";
import { saveCreator } from "@/lib/db";

// Fetches the public profile page, extracts a creator profile via GPT (bio +
// 1-2 posts; estimates signals), and persists it so it joins the match pool.
export async function POST(req: Request) {
  const { link } = await req.json().catch(() => ({ link: "" }));
  const { profile, summary, sourceUrl } = await extractCreator(String(link || ""));
  try {
    await saveCreator(profile, { sourceUrl, summary });
  } catch {
    // Best-effort persistence.
  }
  return NextResponse.json(profile);
}
