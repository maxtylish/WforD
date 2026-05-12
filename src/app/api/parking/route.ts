import { NextRequest, NextResponse } from "next/server";

const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY ?? "";

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

/** Haversine formula — distance in meters between two lat/lng points */
function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const PRICE_MAP: Record<string, number> = {
  PRICE_LEVEL_FREE: 0,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") ?? "0");
  const lng = parseFloat(searchParams.get("lng") ?? "0");
  const radius = parseInt(searchParams.get("radius") ?? "800");

  if (!PLACES_API_KEY) {
    return NextResponse.json({ parking: [] });
  }

  try {
    const body = {
      includedTypes: ["parking"],
      locationRestriction: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: Math.min(radius, 1000),
        },
      },
      maxResultCount: 15,
      rankPreference: "DISTANCE",
    };

    const response = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": PLACES_API_KEY,
        "X-Goog-FieldMask": [
          "places.id",
          "places.displayName",
          "places.formattedAddress",
          "places.location",
          "places.currentOpeningHours",
          "places.rating",
          "places.userRatingCount",
          "places.priceLevel",
        ].join(","),
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("[/api/parking] Places API error:", err);
      return NextResponse.json({ parking: [] });
    }

    const data = await response.json();
    const places: Record<string, unknown>[] = data.places ?? [];

    const parking: ParkingLot[] = places
      .map((p) => {
        const location = p.location as { latitude: number; longitude: number };
        const displayName = p.displayName as { text: string } | undefined;
        const openingHours = p.currentOpeningHours as { openNow?: boolean } | undefined;
        const distance = haversineMeters(lat, lng, location.latitude, location.longitude);
        const priceLevelStr = p.priceLevel as string | undefined;
        return {
          place_id: p.id as string,
          name: displayName?.text ?? "停車場",
          address: (p.formattedAddress as string) ?? "",
          lat: location.latitude,
          lng: location.longitude,
          distance_meters: Math.round(distance),
          is_open: openingHours?.openNow,
          google_rating: (p.rating as number) ?? undefined,
          total_ratings: (p.userRatingCount as number) ?? undefined,
          price_level: priceLevelStr ? PRICE_MAP[priceLevelStr] : undefined,
        };
      })
      .sort((a, b) => a.distance_meters - b.distance_meters);

    return NextResponse.json({ parking });
  } catch (err) {
    console.error("[/api/parking]", err);
    return NextResponse.json({ parking: [] });
  }
}
