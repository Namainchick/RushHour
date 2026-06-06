import { NextResponse } from "next/server";
import { getBusinessesOverview, getCreatorsOverview } from "@/lib/db";

// Always read fresh from Supabase (no caching) — the demo page should reflect
// every business/creator scraped so far.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [businesses, creators] = await Promise.all([
      getBusinessesOverview(),
      getCreatorsOverview(),
    ]);
    return NextResponse.json({ businesses, creators });
  } catch (e) {
    return NextResponse.json(
      { businesses: [], creators: [], error: (e as Error).message },
      { status: 500 },
    );
  }
}
