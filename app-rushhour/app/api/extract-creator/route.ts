import { NextResponse } from "next/server";
import creators from "@/lib/fixtures/creators.json";
import { CreatorProfile } from "@/lib/types";

// TODO: später echte Instagram/TikTok-Analyse. Für die Demo gemockt.
export async function POST(req: Request) {
  const { link } = await req.json().catch(() => ({ link: "" }));
  const all = creators as CreatorProfile[];
  const needle = String(link || "").toLowerCase();
  const match = all.find((c) => needle.includes(c.handle.replace("@", "").toLowerCase())) ?? all[0];
  return NextResponse.json(match);
}
