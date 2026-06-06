// Demo-only data for the creator dashboard (Airbnb-host-style cockpit).
// Everything here is platform-internal state or a count of platform actions —
// deliberately NO measured business outcomes (ROI, guests) so nothing is faked.

export type RequestStatus = "neu" | "angenommen" | "geplant" | "abgeschlossen";

export type CreatorRequest = {
  id: string;
  business: string;
  category: string;
  city: string;
  initial: string; // letter badge instead of a fake logo
  tint: string; // tailwind bg class for the badge
  deliverable: string;
  budget: number;
  matchScore: number;
  status: RequestStatus;
  day?: number; // day in June 2026 once scheduled
};

export const CREATOR_REQUESTS: CreatorRequest[] = [
  { id: "rq_trattoria", business: "Trattoria Bella", category: "Italienisches Restaurant", city: "Hamburg-Eppendorf", initial: "T", tint: "bg-rose-100 text-rose-700", deliverable: "1 Reel + 2 Stories", budget: 350, matchScore: 92, status: "neu" },
  { id: "rq_cafenord", business: "Café Nord", category: "Café & Brunch", city: "Hamburg-Winterhude", initial: "C", tint: "bg-amber-100 text-amber-700", deliverable: "2 Stories", budget: 200, matchScore: 84, status: "neu" },
  { id: "rq_sull", business: "Weinbar Süll", category: "Weinbar", city: "Hamburg-Eimsbüttel", initial: "S", tint: "bg-purple-100 text-purple-700", deliverable: "1 Reel", budget: 300, matchScore: 79, status: "angenommen", day: 9 },
  { id: "rq_greenbowl", business: "Green Bowl", category: "Healthy Food", city: "Hamburg-Ottensen", initial: "G", tint: "bg-emerald-100 text-emerald-700", deliverable: "1 Post + 1 Reel", budget: 400, matchScore: 76, status: "geplant", day: 12 },
  { id: "rq_kaffeeklatsch", business: "Kaffeeklatsch", category: "Specialty Coffee", city: "Hamburg-Sternschanze", initial: "K", tint: "bg-orange-100 text-orange-700", deliverable: "3 Stories", budget: 180, matchScore: 81, status: "geplant", day: 15 },
  { id: "rq_pastabar", business: "Pasta & Co", category: "Italienisch", city: "Hamburg-Altona", initial: "P", tint: "bg-sky-100 text-sky-700", deliverable: "1 Reel", budget: 320, matchScore: 88, status: "abgeschlossen", day: 2 },
];

// Honest platform-internal counts — not impact claims.
export const VISIBILITY = {
  profileViews: 34,
  profileViewsDeltaPct: 12, // vs. last week
  savedBy: 5,
  inMatchLists: 12,
};
