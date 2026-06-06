import {
  BusinessProfile,
  ExtractBusinessResult,
  ExtractCreatorResult,
  MatchResponse,
  MatchResult,
  Weights,
} from "./types";
import { MOCK_BUSINESS, MOCK_CREATOR, mockMatch, mockReport } from "./mock-data";
import { getMockMode } from "./mock-mode";

// Mock vs. real is decided at call time (runtime toggle), not at module load.
async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function extractBusiness(url: string): Promise<ExtractBusinessResult> {
  if (getMockMode()) {
    return {
      profile: MOCK_BUSINESS,
      summary:
        "Family-run Italian restaurant in Hamburg-Eppendorf with a warm, rustic atmosphere and homemade pasta. Appeals to local guests who value authentic cuisine.",
      sourceUrl: "https://trattoria-bella.de",
    };
  }
  return post<ExtractBusinessResult>("/api/extract-business", { url });
}
export async function extractCreator(link: string): Promise<ExtractCreatorResult> {
  if (getMockMode()) {
    return {
      profile: MOCK_CREATOR,
      summary:
        "Hamburg food creator with a warm, authentic style. Strongly local community (71% from Hamburg) and above-average engagement.",
      sourceUrl: "https://instagram.com/lisa_hamburg_eats",
    };
  }
  return post<ExtractCreatorResult>("/api/extract-creator", { link });
}
export async function match(business: BusinessProfile, goalText: string, presetId?: string): Promise<MatchResponse> {
  if (getMockMode()) return mockMatch(presetId);
  return post<MatchResponse>("/api/match", { business, goalText, presetId });
}
export async function report(business: BusinessProfile, result: MatchResult, weights: Weights): Promise<string[]> {
  if (getMockMode()) return mockReport(result);
  const r = await post<{ bullets: string[] }>("/api/report", { business, result, weights });
  return r.bullets;
}
