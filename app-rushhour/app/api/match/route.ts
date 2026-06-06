import { NextResponse } from "next/server";
import creators from "@/lib/fixtures/creators.json";
import { CreatorProfile, BusinessProfile, MatchResponse } from "@/lib/types";
import { goalToWeights } from "@/lib/llm";
import { rankCreators } from "@/lib/matcher";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const business = body.business as BusinessProfile;
  if (!business) return NextResponse.json({ error: "business required" }, { status: 400 });
  const weights = await goalToWeights(body.goalText ?? "", body.presetId);
  const results = rankCreators(business, creators as CreatorProfile[], weights);
  const payload: MatchResponse = { weights, results };
  return NextResponse.json(payload);
}
