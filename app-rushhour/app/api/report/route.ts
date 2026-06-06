import { NextResponse } from "next/server";
import { BusinessProfile, MatchResult, Weights } from "@/lib/types";
import { generateReport } from "@/lib/llm";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const business = body.business as BusinessProfile;
  const result = body.result as MatchResult;
  const weights = body.weights as Weights;
  if (!business || !result) return NextResponse.json({ error: "business and result required" }, { status: 400 });
  const bullets = await generateReport(business, result, weights);
  return NextResponse.json({ bullets });
}
