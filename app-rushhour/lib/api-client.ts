import { BusinessProfile, CreatorProfile, MatchResponse, MatchResult, Weights } from "./types";
import { MOCK_BUSINESS, MOCK_CREATOR, mockMatch, mockReport } from "./mock-data";
import { getMockMode } from "./mock-mode";

// Mock vs. real is decided at call time (runtime toggle), not at module load.
async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function extractBusiness(url: string): Promise<BusinessProfile> {
  if (getMockMode()) return MOCK_BUSINESS;
  return post<BusinessProfile>("/api/extract-business", { url });
}
export async function extractCreator(link: string): Promise<CreatorProfile> {
  if (getMockMode()) return MOCK_CREATOR;
  return post<CreatorProfile>("/api/extract-creator", { link });
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
