"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { Restaurant, LatLng } from "@/types";
import { MapPin, Loader2 } from "lucide-react";

interface MapProps {
  restaurants: Restaurant[];
  selectedRestaurant: Restaurant | null;
  onRestaurantSelect: (restaurant: Restaurant) => void;
  center: LatLng;
  onCenterChange?: (center: LatLng) => void;
  onMapReady?: (map: google.maps.Map) => void;
  isMobile?: boolean;
}

// Custom SVG marker icons
function createMarkerIcon(isVisited: boolean, isSelected: boolean, isParking: boolean) {
  const bg = isSelected ? "#b9251a" : isVisited ? "#16a34a" : isParking ? "#1d4ed8" : "#f04e37";
  const size = isSelected ? 44 : 36;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 52" width="${size}" height="${size * 1.3}">
    <path d="M20 0C9 0 0 9 0 20c0 14 20 32 20 32s20-18 20-32C40 9 31 0 20 0z" fill="${bg}"/>
    <circle cx="20" cy="20" r="10" fill="white" fill-opacity="0.9"/>
    ${isVisited ? '<path d="M14 20l4 4 8-8" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>' :
      isParking ? '<text x="20" y="25" text-anchor="middle" font-size="14" font-weight="bold" fill="#1d4ed8">P</text>' :
      '<circle cx="20" cy="20" r="4" fill="#f04e37"/>'}
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

export default function Map(rawProps: MapProps) {
  const {
    restaurants = [],
    selectedRestaurant = null,
    onRestaurantSelect,
    center,
    onCenterChange,
    onMapReady,
    isMobile = false,
  } = rawProps ?? {};

  if (!onRestaurantSelect || !center) return null;
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Record<string, google.maps.Marker>>({});
  const [loadState, setLoadState] = useState<"idle" | "loading" | "ready" | "no-key" | "error">("idle");

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Initialize map
  useEffect(() => {
    if (!apiKey) { setLoadState("no-key"); return; }
    if (loadState !== "idle") return;
    setLoadState("loading");

    const loadGoogleMaps = async () => {
      try {
        // Dynamic import to avoid SSR issues
        const { Loader } = await import("@googlemaps/js-api-loader");
        const loader = new Loader({
          apiKey,
          version: "weekly",
          libraries: ["places", "geometry"],
        });

        await loader.load();

        if (!mapRef.current) return;

        const map = new google.maps.Map(mapRef.current, {
          center,
          zoom: 14,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: !isMobile,
          zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_TOP,
          },
          gestureHandling: "greedy",
          styles: [
            { featureType: "poi.business", elementType: "labels", stylers: [{ visibility: "off" }] },
            { featureType: "transit", stylers: [{ visibility: "simplified" }] },
          ],
        });

        mapInstanceRef.current = map;
        setLoadState("ready");
        onMapReady?.(map);

        // Listen for map drag to update center
        map.addListener("idle", () => {
          const c = map.getCenter();
          if (c) onCenterChange?.({ lat: c.lat(), lng: c.lng() });
        });
      } catch (err) {
        console.error("[Map] Failed to load Google Maps:", err);
        setLoadState("error");
      }
    };

    loadGoogleMaps();
  }, [apiKey]);

  // Update markers when restaurants change
  useEffect(() => {
    if (loadState !== "ready" || !mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    const currentIds = new Set(restaurants.map((r) => r.place_id));

    // Remove markers no longer in list
    Object.entries(markersRef.current).forEach(([id, marker]) => {
      if (!currentIds.has(id)) {
        marker.setMap(null);
        delete markersRef.current[id];
      }
    });

    // Add/update markers
    restaurants.forEach((restaurant) => {
      const isSelected = selectedRestaurant?.place_id === restaurant.place_id;
      const icon = createMarkerIcon(
        !!restaurant.is_visited,
        isSelected,
        !!restaurant.has_parking
      );

      if (markersRef.current[restaurant.place_id]) {
        const marker = markersRef.current[restaurant.place_id];
        marker.setIcon({ url: icon, scaledSize: new google.maps.Size(isSelected ? 44 : 36, isSelected ? 57 : 47) });
        marker.setZIndex(isSelected ? 100 : 1);
      } else {
        const marker = new google.maps.Marker({
          position: { lat: restaurant.lat, lng: restaurant.lng },
          map,
          title: restaurant.name,
          icon: { url: icon, scaledSize: new google.maps.Size(36, 47) },
          animation: google.maps.Animation.DROP,
        });

        marker.addListener("click", () => onRestaurantSelect(restaurant));
        markersRef.current[restaurant.place_id] = marker;
      }
    });
  }, [restaurants, selectedRestaurant, loadState]);

  // Pan to selected restaurant
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedRestaurant) return;
    mapInstanceRef.current.panTo({ lat: selectedRestaurant.lat, lng: selectedRestaurant.lng });
  }, [selectedRestaurant]);

  // ── Render states ──────────────────────────────────────────────────────────
  if (loadState === "no-key") {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 gap-4 p-6 text-center">
        <div className="w-16 h-16 bg-brand-100 rounded-2xl flex items-center justify-center">
          <MapPin className="w-8 h-8" style={{ color: "var(--brand)" }} />
        </div>
        <div>
          <p className="font-bold text-gray-800 text-lg">需要 Google Maps API Key</p>
          <p className="text-sm text-gray-500 mt-1 max-w-sm">
            請複製 <code className="bg-gray-200 px-1 rounded text-xs">.env.local.example</code> 為{" "}
            <code className="bg-gray-200 px-1 rounded text-xs">.env.local</code>，
            填入 Google Maps API Key 後重新啟動。
          </p>
          <p className="text-xs text-gray-400 mt-2">
            申請教學請參考 <strong>SETUP.md</strong>
          </p>
        </div>
        <div className="text-xs text-gray-400 bg-white border border-dashed border-gray-300 rounded-xl px-4 py-3">
          目前顯示 Demo 資料（無實際地圖）
        </div>
      </div>
    );
  }

  if (loadState === "error") {
    return (
      <div className="w-full h-full flex items-center justify-center bg-red-50">
        <p className="text-red-600 text-sm">地圖載入失敗，請檢查 API Key 是否正確</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      {loadState === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--brand)" }} />
        </div>
      )}
    </div>
  );
}
