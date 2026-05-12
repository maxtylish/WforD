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
          radius: Math.min(radius, 1000), // cap at 1km for relevance
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
        ].join(","),
      },
      body: JSON.stringify(body),
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
        return {
          place_id: p.id as string,
          name: displayName?.text ?? "停車場",
          address: (p.formattedAddress as string) ?? "",
          lat: location.latitude,
          lng: location.longitude,
          distance_meters: Math.round(distance),
          is_open: openingHours?.openNow,
        };
      })
      .sort((a, b) => a.distance_meters - b.distance_meters);

    return NextResponse.json({ parking });
  } catch (err) {
    console.error("[/api/parking]", err);
    return NextResponse.json({ parking: [] });
  }
}
