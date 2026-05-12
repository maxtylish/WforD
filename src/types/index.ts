// ── Cuisine Types ─────────────────────────────────────────────────────────
export type CuisineType =
  | "全部" | "台式" | "中式" | "日式" | "韓式"
  | "義式" | "美式" | "東南亞" | "火鍋" | "燒烤"
  | "早午餐" | "甜點咖啡" | "海鮮" | "素食" | "百貨美食街" | "其他";

export const CUISINE_TYPES: CuisineType[] = [
  "全部","台式","中式","日式","韓式","義式","美式",
  "東南亞","火鍋","燒烤","早午餐","甜點咖啡","海鮮","素食","百貨美食街","其他",
];

export const CUISINE_TO_PLACE_TYPES: Record<CuisineType, string[]> = {
  全部:      ["restaurant"],
  台式:      ["taiwanese_restaurant"],
  中式:      ["chinese_restaurant"],
  日式:      ["japanese_restaurant","sushi_restaurant","ramen_restaurant"],
  韓式:      ["korean_restaurant"],
  義式:      ["italian_restaurant","pizza_restaurant"],
  美式:      ["american_restaurant","hamburger_restaurant","steak_house"],
  東南亞:    ["thai_restaurant","vietnamese_restaurant"],
  火鍋:      ["hot_pot_restaurant"],
  燒烤:      ["barbecue_restaurant"],
  早午餐:    ["breakfast_restaurant","brunch_restaurant","cafe"],
  甜點咖啡:  ["dessert_shop","coffee_shop","bakery","ice_cream_shop"],
  海鮮:      ["seafood_restaurant"],
  素食:      [],
  百貨美食街:["shopping_mall","food_court"],
  其他:      ["restaurant"],
};

export const TEXT_SEARCH_QUERIES: Partial<Record<CuisineType, string>> = {
  素食: "素食餐廳",
};

export function detectCuisineType(placeTypes: string[]): CuisineType {
  const t = new Set(placeTypes);
  if (t.has("taiwanese_restaurant"))                                    return "台式";
  if (t.has("chinese_restaurant"))                                      return "中式";
  if (t.has("japanese_restaurant")||t.has("sushi_restaurant")||t.has("ramen_restaurant")) return "日式";
  if (t.has("korean_restaurant"))                                       return "韓式";
  if (t.has("italian_restaurant")||t.has("pizza_restaurant"))           return "義式";
  if (t.has("american_restaurant")||t.has("hamburger_restaurant")||t.has("steak_house")) return "美式";
  if (t.has("thai_restaurant")||t.has("vietnamese_restaurant"))         return "東南亞";
  if (t.has("hot_pot_restaurant"))                                      return "火鍋";
  if (t.has("barbecue_restaurant"))                                     return "燒烤";
  if (t.has("breakfast_restaurant")||t.has("brunch_restaurant"))        return "早午餐";
  if (t.has("dessert_shop")||t.has("coffee_shop")||t.has("bakery")||t.has("ice_cream_shop")) return "甜點咖啡";
  if (t.has("seafood_restaurant"))                                      return "海鮮";
  if (t.has("shopping_mall")||t.has("food_court")||t.has("department_store")) return "百貨美食街";
  if (t.has("noodle_restaurant"))                                       return "台式";
  if (t.has("cafe"))                                                    return "甜點咖啡";
  return "其他";
}

// ── Price Level ───────────────────────────────────────────────────────────
export const PRICE_LEVEL_INFO: Record<number, { range: string; color: string; label: string }> = {
  1: { range: "$150 以下",  color: "text-green-600 bg-green-50",   label: "便宜" },
  2: { range: "$150–400",  color: "text-blue-600 bg-blue-50",     label: "適中" },
  3: { range: "$400–800",  color: "text-orange-600 bg-orange-50", label: "偏貴" },
  4: { range: "$800 以上", color: "text-red-600 bg-red-50",       label: "高級" },
};

// ── Parking Types ─────────────────────────────────────────────────────────
export type ParkingType =
  | "自有免費停車場"
  | "自有付費停車場"
  | "代客停車"
  | "附近工友車位"
  | "附近公有停車場"
  | "附近路邊停車"
  | "無停車";

export const PARKING_TYPES: ParkingType[] = [
  "自有免費停車場",
  "自有付費停車場",
  "代客停車",
  "附近工友車位",
  "附近公有停車場",
  "附近路邊停車",
  "無停車",
];

export const PARKING_TYPE_INFO: Record<ParkingType, { icon: string; color: string }> = {
  "自有免費停車場": { icon: "🅿️", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  "自有付費停車場": { icon: "🅿️", color: "text-teal-700 bg-teal-50 border-teal-200" },
  "代客停車":       { icon: "🚗", color: "text-blue-700 bg-blue-50 border-blue-200" },
  "附近工友車位":   { icon: "🔑", color: "text-purple-700 bg-purple-50 border-purple-200" },
  "附近公有停車場": { icon: "🏛️", color: "text-indigo-700 bg-indigo-50 border-indigo-200" },
  "附近路邊停車":   { icon: "🛣️", color: "text-yellow-700 bg-yellow-50 border-yellow-200" },
  "無停車":         { icon: "❌", color: "text-gray-500 bg-gray-50 border-gray-200" },
};

// From Google parkingOptions → our ParkingType[]
export function detectParkingTypes(parkingOptions: Record<string, boolean> | null | undefined): ParkingType[] {
  if (!parkingOptions) return [];
  const result: ParkingType[] = [];
  if (parkingOptions.freeParkingLot || parkingOptions.freeGarageParking)  result.push("自有免費停車場");
  if (parkingOptions.paidParkingLot || parkingOptions.paidGarageParking)  result.push("自有付費停車場");
  if (parkingOptions.valetParking)                                         result.push("代客停車");
  if (parkingOptions.freeStreetParking || parkingOptions.paidStreetParking) result.push("附近路邊停車");
  return result;
}

// ── Restaurant interface ──────────────────────────────────────────────────
export interface Restaurant {
  place_id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  google_rating: number;
  total_ratings?: number;
  cuisine_type: CuisineType;
  price_level?: number;
  parking_types?: ParkingType[];     // from Google parkingOptions
  has_parking?: boolean;
  parking_distance_meters?: number;
  photo_url?: string | null;
  is_open?: boolean;
  is_visited?: boolean;
  visited_id?: string;
  personal_rating?: number;
  review_text?: string;
  phone?: string;
  is_favorite?: boolean;
}

// ── VisitedPlace ──────────────────────────────────────────────────────────
export interface VisitedPlace {
  id: string;
  place_id: string;
  name: string;
  address: string;
  cuisine_type: CuisineType;
  google_rating: number;
  has_parking: boolean;
  parking_type?: ParkingType | null;
  parking_distance_meters?: number | null;
  lat: number;
  lng: number;
  visited_at: string;
  personal_rating?: number | null;
  review_text?: string | null;
  photo_url?: string | null;
  created_at: string;
  updated_at: string;
}

// ── Search Filters ────────────────────────────────────────────────────────
export type SortBy = "POPULARITY" | "DISTANCE" | "RATING";

export interface SearchFilters {
  cuisineType: CuisineType;
  minRating: number;
  searchRadius: number;
  keyword: string;
  openNow: boolean;
  maxPriceLevel: number;   // 0 = 不限, 1–4
  requireParking: boolean;
  sortBy: SortBy;
}

export interface LatLng { lat: number; lng: number; }
export const TAICHUNG_CENTER: LatLng = { lat: 24.1477, lng: 120.6736 };

// ── Favorite Place ────────────────────────────────────────────────────────
export interface FavoritePlace {
  id: string;
  place_id: string;
  name: string;
  address: string;
  cuisine_type: CuisineType;
  google_rating: number;
  lat: number;
  lng: number;
  photo_url?: string | null;
  price_level?: number | null;
  created_at: string;
}

// ── Parking Lot (from /api/parking) ──────────────────────────────────────
export interface ParkingLot {
  place_id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distance_meters: number;
  is_open?: boolean;
  google_rating?: number;
  total_ratings?: number;
  price_level?: number; // 0=免費 1=便宜 2=適中 3=貴
}
