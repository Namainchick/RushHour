import { NextResponse } from "next/server";
import fixtures from "@/lib/fixtures/creators.json";
import { CreatorProfile, BusinessProfile, MatchResponse } from "@/lib/types";
import { goalToWeights } from "@/lib/llm";
import { rankCreators } from "@/lib/matcher";
import { getAllCreators } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const business = body.business as BusinessProfile;
  if (!business) return NextResponse.json({ error: "business required" }, { status: 400 });

  // Real pool from Supabase; fall back to bundled fixtures if the DB is empty
  // or unreachable, so the demo always has creators to rank.
  let creators: CreatorProfile[] = [];
  try {
    creators = await getAllCreators();
  } catch {
    creators = [];
  }
  if (creators.length === 0) creators = fixtures as CreatorProfile[];

  const weights = await goalToWeights(body.goalText ?? "", body.presetId);
  const results = rankCreators(business, creators, weights);
  const payload: MatchResponse = { weights, results };
  return NextResponse.json(payload);
}
