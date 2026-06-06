import { BusinessProfile, CreatorProfile, MatchResponse, MatchResult, Weights } from "./types";
import { MOCK_BUSINESS, MOCK_CREATOR, mockMatch, mockReport } from "./mock-data";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function extractBusiness(url: string): Promise<BusinessProfile> {
  if (USE_MOCK) return MOCK_BUSINESS;
  return post<BusinessProfile>("/api/extract-business", { url });
}
export async function extractCreator(link: string): Promise<CreatorProfile> {
  if (USE_MOCK) return MOCK_CREATOR;
  return post<CreatorProfile>("/api/extract-creator", { link });
}
export async function match(business: BusinessProfile, goalText: string, presetId?: string): Promise<MatchResponse> {
  if (USE_MOCK) return mockMatch(presetId);
  return post<MatchResponse>("/api/match", { business, goalText, presetId });
}
export async function report(business: BusinessProfile, result: MatchResult, weights: Weights): Promise<string[]> {
  if (USE_MOCK) return mockReport(result);
  const r = await post<{ bullets: string[] }>("/api/report", { business, result, weights });
  return r.bullets;
}
