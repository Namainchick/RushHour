// Rich, demo-only profile content for each creator (Airbnb-listing style).
// Kept out of the shared matching fixture so the backend contract stays lean.

export type Review = {
  author: string;
  avatar: string;
  date: string;
  rating: number;
  text: string;
  business: string;
};

export type CreatorDetail = {
  rating: number; // 0..5
  reviewsCount: number;
  responseRate: number; // 0..100
  priceFrom: number; // € per collaboration
  bio: string;
  highlights: string[];
  gallery: string[];
  reviews: Review[];
};

const U = (id: string, w = 800) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&q=80&auto=format&fit=crop`;

export const CREATOR_DETAILS: Record<string, CreatorDetail> = {
  cr_lisa: {
    rating: 4.96,
    reviewsCount: 38,
    responseRate: 100,
    priceFrom: 250,
    bio: "Lisa zeigt die echten Lieblingsorte ihrer Nachbarschaft in Hamburg-Eppendorf und Winterhude. Warme, ehrliche Food-Stories statt Hochglanz — ihre Community kommt aus genau den Vierteln, in denen lokale Gäste sitzen sollen.",
    highlights: [
      "71 % der Follower wohnen in Hamburg",
      "8,2 % Engagement — 4× über dem Schnitt",
      "Antwortet meist innerhalb von 1 Stunde",
    ],
    gallery: [U("1554118811-1e0d58224f24"), U("1414235077428-338989a2e8c0"), U("1555396273-367ea4eb4db5"), U("1517248135467-4c7edcad34c4"), U("1559925393-8be0ec4767c8")],
    reviews: [
      { author: "Marco R.", avatar: "https://i.pravatar.cc/100?img=15", date: "Mai 2026", rating: 5, text: "Nach Lisas Reel waren wir zwei Wochenenden komplett ausgebucht. Echte Hamburger Gäste, kein Streuverlust.", business: "Café Nord, Eppendorf" },
      { author: "Sophie L.", avatar: "https://i.pravatar.cc/100?img=32", date: "April 2026", rating: 5, text: "Super unkompliziert, sehr authentische Bilder. Genau unser Stil.", business: "Weinbar Süll" },
      { author: "Deniz K.", avatar: "https://i.pravatar.cc/100?img=51", date: "März 2026", rating: 5, text: "Die Reservierungen kamen direkt am Tag des Posts. Klare Empfehlung.", business: "Trattoria Bella" },
    ],
  },
  cr_foodie_de: {
    rating: 4.71,
    reviewsCount: 112,
    responseRate: 88,
    priceFrom: 1200,
    bio: "Foodie Germany ist eine der größten deutschen Food-Bühnen. Cleane, glänzende Produktionen mit bundesweiter Reichweite — ideal für Launches und Markenbekanntheit, weniger für lokale Laufkundschaft.",
    highlights: [
      "210.000 Follower bundesweit",
      "Reichweite im Top-1-%-Bereich",
      "Stark für Produkt-Launches & Awareness",
    ],
    gallery: [U("1504674900247-0877df9cc836"), U("1565299624946-b28f40a0ae38"), U("1540189549336-e6e99c3679fe"), U("1565958011703-44f9829ba187"), U("1414235077428-338989a2e8c0")],
    reviews: [
      { author: "Jonas W.", avatar: "https://i.pravatar.cc/100?img=8", date: "Mai 2026", rating: 5, text: "Riesige Reichweite, sehr professionelle Produktion. Perfekt für unseren Produkt-Launch.", business: "SaucenManufaktur" },
      { author: "Aylin T.", avatar: "https://i.pravatar.cc/100?img=45", date: "April 2026", rating: 4, text: "Tolle Bilder und Reach, aber für unser lokales Lokal war die Zielgruppe zu breit gestreut.", business: "Bistro Klein, Köln" },
      { author: "Markus B.", avatar: "https://i.pravatar.cc/100?img=60", date: "Februar 2026", rating: 5, text: "Bundesweite Sichtbarkeit über Nacht. Würde ich wieder buchen.", business: "Hofgut Limonade" },
    ],
  },
  cr_max: {
    rating: 4.85,
    reviewsCount: 57,
    responseRate: 95,
    priceFrom: 600,
    bio: "Max macht schnelle, energetische TikToks über das urbane Leben in Hamburg. Junge, lokale Zielgruppe, die gern neue Spots ausprobiert — gut, um in der Stadt Trend-Aufmerksamkeit zu erzeugen.",
    highlights: [
      "55 % lokale Hamburger Zielgruppe",
      "Stark bei der Gen-Z & Young-Urban-Crowd",
      "TikTok-native, hohe Watch-Time",
    ],
    gallery: [U("1449824913935-59a10b8d2000"), U("1480714378408-67cf0d13bc1b"), U("1502920917128-1aa500764cbd"), U("1517248135467-4c7edcad34c4"), U("1555396273-367ea4eb4db5")],
    reviews: [
      { author: "Nina H.", avatar: "https://i.pravatar.cc/100?img=23", date: "Mai 2026", rating: 5, text: "Sein TikTok ging bei uns durch die Decke — viele junge Gäste, die wir vorher nie erreicht haben.", business: "Späti & Bar 47" },
      { author: "Leon F.", avatar: "https://i.pravatar.cc/100?img=12", date: "März 2026", rating: 4, text: "Sehr kreativ und schnell. Format passt perfekt für Trend-Spots.", business: "Smash Burger HH" },
      { author: "Carla M.", avatar: "https://i.pravatar.cc/100?img=36", date: "Februar 2026", rating: 5, text: "Energetisch, professionell, on point. Gerne wieder.", business: "Matcha Bar Sternschanze" },
    ],
  },
  cr_pasta_queen: {
    rating: 4.88,
    reviewsCount: 64,
    responseRate: 92,
    priceFrom: 900,
    bio: "Pasta Queen lebt italienische Küche — warme, rustikale Rezept-Reels mit großer Foodie-Community. Markenstil passt perfekt zu klassischen italienischen Konzepten, Schwerpunkt München.",
    highlights: [
      "Markenstil: warm, rustikal, authentisch",
      "95.000 food-affine Follower",
      "Perfekt für italienische Konzepte",
    ],
    gallery: [U("1473093226795-af9932fe5856"), U("1551183053-bf91a1d81141"), U("1481931098730-318b6f776db0"), U("1565299624946-b28f40a0ae38"), U("1517248135467-4c7edcad34c4")],
    reviews: [
      { author: "Giulia P.", avatar: "https://i.pravatar.cc/100?img=29", date: "April 2026", rating: 5, text: "Ihre Pasta-Reels sehen unglaublich gut aus und passen perfekt zu unserem Konzept.", business: "Osteria Vera, München" },
      { author: "Tobias S.", avatar: "https://i.pravatar.cc/100?img=53", date: "März 2026", rating: 5, text: "Sehr ästhetisch, große food-affine Community. Top Zusammenarbeit.", business: "Dolce Forno" },
      { author: "Elena R.", avatar: "https://i.pravatar.cc/100?img=40", date: "Januar 2026", rating: 4, text: "Tolle Bilder, etwas weniger lokal als gedacht — für Awareness aber stark.", business: "Ristorante Sole" },
    ],
  },
};

export function getCreatorDetail(id: string): CreatorDetail | null {
  return CREATOR_DETAILS[id] ?? null;
}
