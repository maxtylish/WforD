import { NextRequest, NextResponse } from "next/server";
import type { Restaurant, CuisineType, SortBy } from "@/types";
import { CUISINE_TO_PLACE_TYPES, TEXT_SEARCH_QUERIES, detectCuisineType, detectParkingTypes } from "@/types";

const GOOGLE_KEY =
  process.env.GOOGLE_PLACES_API_KEY ??
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.rating",
  "places.userRatingCount",
  "places.priceLevel",
  "places.currentOpeningHours",
  "places.photos",
  "places.types",
  "places.parkingOptions",
  "places.internationalPhoneNumber",
].join(",");

const PRICE_MAP: Record<string, number> = {
  PRICE_LEVEL_FREE: 0,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
};

// ── API calls ─────────────────────────────────────────────────────────────
async function nearbySearch(
  lat: number, lng: number, radius: number,
  includedTypes: string[], sortBy: SortBy
) {
  const rankPreference = sortBy === "DISTANCE" ? "DISTANCE" : "POPULARITY";
  return fetch("https://places.googleapis.com/v1/places:searchNearby", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_KEY,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify({
      includedTypes,
      maxResultCount: 20,
      locationRestriction: {
        circle: { center: { latitude: lat, longitude: lng }, radius },
      },
      rankPreference,
      languageCode: "zh-TW",
    }),
    // Cache nearby browse results for 2 minutes (data doesn't change fast)
    next: { revalidate: 120 },
  });
}

async function textSearch(
  query: string, lat: number, lng: number, radius: number,
  noCache = false
) {
  return fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_KEY,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify({
      textQuery: query,
      maxResultCount: 20,
      // Generous 15km bias so all city branches appear; not a hard restriction
      locationBias: {
        circle: { center: { latitude: lat, longitude: lng }, radius: Math.max(radius, 15000) },
      },
      rankPreference: "RELEVANCE",
      languageCode: "zh-TW",
    }),
    // Keyword / brand searches must always be fresh — never serve stale cache
    ...(noCache ? { cache: "no-store" } : { next: { revalidate: 60 } }),
  });
}

// ── Map place → Restaurant ────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPlace(p: any, selectedCuisine: CuisineType): Restaurant {
  const placeTypes: string[] = p.types ?? [];
  const cuisine: CuisineType =
    selectedCuisine !== "全部" ? selectedCuisine : detectCuisineType(placeTypes);

  const parkingTypes = detectParkingTypes(p.parkingOptions);
  const hasParking = parkingTypes.length > 0 &&
    parkingTypes.some(pt => pt === "自有免費停車場" || pt === "自有付費停車場" || pt === "代客停車");

  const photoName = p.photos?.[0]?.name;

  return {
    place_id: p.id,
    name: p.displayName?.text ?? "",
    address: p.formattedAddress ?? "",
    lat: p.location?.latitude ?? 0,
    lng: p.location?.longitude ?? 0,
    google_rating: p.rating ?? 0,
    total_ratings: p.userRatingCount ?? 0,
    cuisine_type: cuisine,
    price_level: p.priceLevel ? PRICE_MAP[p.priceLevel] : undefined,
    is_open: p.currentOpeningHours?.openNow,
    parking_types: parkingTypes.length > 0 ? parkingTypes : undefined,
    has_parking: hasParking,
    photo_url: photoName
      ? `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=400&key=${GOOGLE_KEY}`
      : null,
    phone: p.internationalPhoneNumber,
  };
}

// ── Route handler ─────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const lat          = parseFloat(searchParams.get("lat")          ?? "24.1477");
  const lng          = parseFloat(searchParams.get("lng")          ?? "120.6736");
  const radius       = parseInt  (searchParams.get("radius")       ?? "2000");
  const cuisine      = (searchParams.get("type") ?? "全部") as CuisineType;
  const minRating    = parseFloat(searchParams.get("minRating")    ?? "4.0");
  const keyword      = searchParams.get("keyword")?.trim()         ?? "";
  const openNow      = searchParams.get("openNow")                 === "true";
  const maxPrice     = parseInt  (searchParams.get("maxPrice")     ?? "0");
  const requirePark  = searchParams.get("requireParking")          === "true";
  const sortBy       = (searchParams.get("sortBy") ?? "POPULARITY") as SortBy;

  if (!GOOGLE_KEY) return NextResponse.json({ restaurants: [] });

  try {
    let raw: Response;
    let searchMode: string;
    let searchQuery: string;

    if (keyword) {
      // Brand / name search: use keyword only — location is handled by locationBias.
      // Adding a city name to the query often confuses the Places API ranking.
      searchQuery = cuisine !== "全部" ? `${keyword} ${cuisine}` : keyword;
      searchMode = "textSearch(keyword)";
      raw = await textSearch(searchQuery, lat, lng, radius, /* noCache */ true);
    } else if (TEXT_SEARCH_QUERIES[cuisine]) {
      searchQuery = `${TEXT_SEARCH_QUERIES[cuisine]} 台中`;
      searchMode = "textSearch(cuisine)";
      raw = await textSearch(searchQuery, lat, lng, radius);
    } else {
      const types = CUISINE_TO_PLACE_TYPES[cuisine] ?? ["restaurant"];
      searchQuery = types.join(",");
      searchMode = "nearbySearch";
      raw = await nearbySearch(lat, lng, radius, types, sortBy);
    }

    console.log(`[restaurants] mode=${searchMode} query="${searchQuery}" status=${raw.status}`);

    if (!raw.ok) {
      const err = await raw.text();
      console.error("[restaurants] Places API error:", raw.status, err);
      return NextResponse.json({ restaurants: [], _debug: { mode: searchMode, query: searchQuery, httpStatus: raw.status, apiError: err } });
    }

    const data = await raw.json();
    const places = data.places ?? [];
    console.log(`[restaurants] raw places returned: ${places.length}`);

    let restaurants: Restaurant[] = places.map((p: any) => mapPlace(p, cuisine));

    // Client-side filters
    // ALL filters are skipped for keyword/brand searches — the user explicitly
    // typed a name, so show every matching location regardless of rating/price/etc.
    if (!keyword) {
      if (minRating > 0) restaurants = restaurants.filter(r => r.google_rating >= minRating);
      if (openNow)       restaurants = restaurants.filter(r => r.is_open === true);
      if (maxPrice > 0)  restaurants = restaurants.filter(r => !r.price_level || r.price_level <= maxPrice);
      if (requirePark)   restaurants = restaurants.filter(r => r.has_parking || (r.parking_types && r.parking_types.length > 0));
    }

    console.log(`[restaurants] after filter: ${restaurants.length}`);

    // Sort by rating if requested
    if (sortBy === "RATING") {
      restaurants.sort((a, b) => (b.google_rating ?? 0) - (a.google_rating ?? 0));
    }

    return NextResponse.json({
      restaurants,
      _debug: { mode: searchMode, query: searchQuery, rawCount: places.length, finalCount: restaurants.length },
    });
  } catch (err) {
    console.error("[restaurants API] exception:", err);
    return NextResponse.json({ error: String(err), restaurants: [] }, { status: 500 });
  }
}
