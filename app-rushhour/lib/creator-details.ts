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
    bio: "Lisa showcases the real local favorites in her Hamburg-Eppendorf and Winterhude neighborhood. Warm, honest food stories instead of glossy production — her community comes from exactly the neighborhoods where you want local guests to sit.",
    highlights: [
      "71% of followers live in Hamburg",
      "8.2% engagement — 4× above average",
      "Usually replies within 1 hour",
    ],
    gallery: [U("1554118811-1e0d58224f24"), U("1414235077428-338989a2e8c0"), U("1555396273-367ea4eb4db5"), U("1517248135467-4c7edcad34c4"), U("1559925393-8be0ec4767c8")],
    reviews: [
      { author: "Marco R.", avatar: "https://i.pravatar.cc/100?img=15", date: "May 2026", rating: 5, text: "After Lisa's reel we were fully booked for two weekends straight. Real Hamburg guests, no wasted reach.", business: "Café Nord, Eppendorf" },
      { author: "Sophie L.", avatar: "https://i.pravatar.cc/100?img=32", date: "April 2026", rating: 5, text: "Super easy to work with, very authentic photos. Exactly our style.", business: "Weinbar Süll" },
      { author: "Deniz K.", avatar: "https://i.pravatar.cc/100?img=51", date: "March 2026", rating: 5, text: "The reservations came in the same day as the post. Clearly recommended.", business: "Trattoria Bella" },
    ],
  },
  cr_foodie_de: {
    rating: 4.71,
    reviewsCount: 112,
    responseRate: 88,
    priceFrom: 1200,
    bio: "Foodie Germany is one of the largest German food stages. Clean, polished productions with nationwide reach — ideal for launches and brand awareness, less so for local walk-in traffic.",
    highlights: [
      "210,000 followers nationwide",
      "Reach in the top 1%",
      "Strong for product launches & awareness",
    ],
    gallery: [U("1504674900247-0877df9cc836"), U("1565299624946-b28f40a0ae38"), U("1540189549336-e6e99c3679fe"), U("1565958011703-44f9829ba187"), U("1414235077428-338989a2e8c0")],
    reviews: [
      { author: "Jonas W.", avatar: "https://i.pravatar.cc/100?img=8", date: "May 2026", rating: 5, text: "Huge reach, very professional production. Perfect for our product launch.", business: "SaucenManufaktur" },
      { author: "Aylin T.", avatar: "https://i.pravatar.cc/100?img=45", date: "April 2026", rating: 4, text: "Great photos and reach, but for our local spot the audience was spread too wide.", business: "Bistro Klein, Köln" },
      { author: "Markus B.", avatar: "https://i.pravatar.cc/100?img=60", date: "February 2026", rating: 5, text: "Nationwide visibility overnight. Would book again.", business: "Hofgut Limonade" },
    ],
  },
  cr_max: {
    rating: 4.85,
    reviewsCount: 57,
    responseRate: 95,
    priceFrom: 600,
    bio: "Max makes fast, energetic TikToks about urban life in Hamburg. A young, local audience that loves trying new spots — great for sparking trend attention around the city.",
    highlights: [
      "55% local Hamburg audience",
      "Strong with the Gen-Z & young-urban crowd",
      "TikTok-native, high watch time",
    ],
    gallery: [U("1449824913935-59a10b8d2000"), U("1480714378408-67cf0d13bc1b"), U("1502920917128-1aa500764cbd"), U("1517248135467-4c7edcad34c4"), U("1555396273-367ea4eb4db5")],
    reviews: [
      { author: "Nina H.", avatar: "https://i.pravatar.cc/100?img=23", date: "May 2026", rating: 5, text: "His TikTok blew up for us — lots of young guests we'd never reached before.", business: "Späti & Bar 47" },
      { author: "Leon F.", avatar: "https://i.pravatar.cc/100?img=12", date: "March 2026", rating: 4, text: "Very creative and fast. The format is perfect for trend spots.", business: "Smash Burger HH" },
      { author: "Carla M.", avatar: "https://i.pravatar.cc/100?img=36", date: "February 2026", rating: 5, text: "Energetic, professional, on point. Happy to work together again.", business: "Matcha Bar Sternschanze" },
    ],
  },
  cr_pasta_queen: {
    rating: 4.88,
    reviewsCount: 64,
    responseRate: 92,
    priceFrom: 900,
    bio: "Pasta Queen lives Italian cuisine — warm, rustic recipe reels with a large foodie community. Her brand style is a perfect fit for classic Italian concepts, focused on Munich.",
    highlights: [
      "Brand style: warm, rustic, authentic",
      "95,000 food-loving followers",
      "Perfect for Italian concepts",
    ],
    gallery: [U("1473093226795-af9932fe5856"), U("1551183053-bf91a1d81141"), U("1481931098730-318b6f776db0"), U("1565299624946-b28f40a0ae38"), U("1517248135467-4c7edcad34c4")],
    reviews: [
      { author: "Giulia P.", avatar: "https://i.pravatar.cc/100?img=29", date: "April 2026", rating: 5, text: "Her pasta reels look incredibly good and fit our concept perfectly.", business: "Osteria Vera, München" },
      { author: "Tobias S.", avatar: "https://i.pravatar.cc/100?img=53", date: "March 2026", rating: 5, text: "Very aesthetic, a large food-loving community. Great collaboration.", business: "Dolce Forno" },
      { author: "Elena R.", avatar: "https://i.pravatar.cc/100?img=40", date: "January 2026", rating: 4, text: "Great photos, a bit less local than expected — but strong for awareness.", business: "Ristorante Sole" },
    ],
  },
};

export function getCreatorDetail(id: string): CreatorDetail | null {
  return CREATOR_DETAILS[id] ?? null;
}
