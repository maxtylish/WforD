"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import type { Restaurant, VisitedPlace, SearchFilters, LatLng } from "@/types";
import { TAICHUNG_CENTER } from "@/types";
import { MOCK_RESTAURANTS } from "@/lib/mock-data";
import {
  isSupabaseConfigured,
  getVisitedPlaces,
  upsertVisitedPlace,
  updateVisitedPlace,
  deleteVisitedPlace,
  lsGetVisited,
  lsSaveVisited,
} from "@/lib/supabase";
import FilterBar from "@/components/FilterBar";
import RestaurantList from "@/components/RestaurantList";
import VisitedTab from "@/components/VisitedTab";
import ReviewModal, { type ReviewFormData } from "@/components/ReviewModal";
import { MapPin, List, Bookmark, LocateFixed, ChevronUp } from "lucide-react";

// Dynamically import Map to avoid SSR issues with Google Maps
const Map = dynamic(() => import("@/components/Map"), { ssr: false });

const DEFAULT_FILTERS: SearchFilters = {
  cuisineType: "全部",
  minRating: 4.0,
  searchRadius: 2000,
  keyword: "",
  openNow: false,
  maxPriceLevel: 0,
  requireParking: false,
  sortBy: "POPULARITY",
};

type Tab = "search" | "visited";
type PanelState = "collapsed" | "half" | "full";

export default function HomePage() {
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [visitedPlaces, setVisitedPlaces] = useState<VisitedPlace[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [mapCenter, setMapCenter] = useState<LatLng>(TAICHUNG_CENTER);
  const [activeTab, setActiveTab] = useState<Tab>("search");
  const [loading, setLoading] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<Restaurant | null>(null);
  const [editTarget, setEditTarget] = useState<VisitedPlace | null>(null);
  const [panelState, setPanelState] = useState<PanelState>("half");
  const [hasMapsKey] = useState(() => !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);

  // Merge visited status into restaurants
  const enrichedRestaurants = restaurants.map((r) => {
    const visited = visitedPlaces.find((v) => v.place_id === r.place_id);
    return visited
      ? {
          ...r,
          is_visited: true,
          visited_id: visited.id,
          personal_rating: visited.personal_rating ?? undefined,
          review_text: visited.review_text ?? undefined,
          has_parking: visited.has_parking,
          parking_distance_meters: visited.parking_distance_meters ?? undefined,
        }
      : r;
  });

  // ── Data loading ───────────────────────────────────────────────────────────
  const loadVisited = useCallback(async () => {
    if (isSupabaseConfigured()) {
      const data = await getVisitedPlaces();
      setVisitedPlaces(data);
    } else {
      setVisitedPlaces(lsGetVisited());
    }
  }, []);

  const searchRestaurants = useCallback(async () => {
    if (!hasMapsKey) {
      // Demo mode: filter mock data
      const filtered = MOCK_RESTAURANTS.filter((r) => {
        if (filters.cuisineType !== "全部" && r.cuisine_type !== filters.cuisineType) return false;
        if (filters.minRating > 0 && r.google_rating < filters.minRating) return false;
        if (filters.keyword && !r.name.includes(filters.keyword)) return false;
        return true;
      });
      setRestaurants(filtered);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        lat: String(mapCenter.lat),
        lng: String(mapCenter.lng),
        radius: String(filters.searchRadius),
        type: filters.cuisineType,
        minRating: String(filters.minRating),
        keyword: filters.keyword,
        openNow: String(filters.openNow),
        maxPrice: String(filters.maxPriceLevel),
        requireParking: String(filters.requireParking),
        sortBy: filters.sortBy,
      });
      const res = await fetch(`/api/restaurants?${params}`);
      const json = await res.json();
      setRestaurants(json.restaurants ?? []);
    } catch (err) {
      console.error("[searchRestaurants]", err);
    } finally {
      setLoading(false);
    }
  }, [hasMapsKey, filters, mapCenter]);

  useEffect(() => {
    loadVisited();
    searchRestaurants();
  }, []); // Initial load

  // ── Geolocation ────────────────────────────────────────────────────────────
  const handleLocate = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMapCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => console.warn("[Geolocation]", err.message)
    );
  };

  // ── Navigation ─────────────────────────────────────────────────────────────
  const handleNavigate = (target: Restaurant | VisitedPlace) => {
    const lat = target.lat;
    const lng = target.lng;
    const name = target.name;
    // Opens Google Maps navigation (works on mobile and desktop)
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${
      (target as Restaurant).place_id ?? ""
    }&travelmode=driving`;
    window.open(url, "_blank");
  };

  // ── Review / Record ────────────────────────────────────────────────────────
  const handleOpenRecord = (restaurant: Restaurant) => {
    setReviewTarget(restaurant);
    setEditTarget(null);
  };

  const handleOpenEdit = (place: VisitedPlace) => {
    // Construct a minimal Restaurant object from VisitedPlace for modal
    const restaurant: Restaurant = {
      place_id: place.place_id,
      name: place.name,
      address: place.address,
      lat: place.lat,
      lng: place.lng,
      google_rating: place.google_rating,
      cuisine_type: place.cuisine_type,
      has_parking: place.has_parking,
      parking_distance_meters: place.parking_distance_meters ?? undefined,
    };
    setReviewTarget(restaurant);
    setEditTarget(place);
  };

  const handleSaveReview = async (data: ReviewFormData) => {
    if (!reviewTarget) return;

    const payload: Omit<VisitedPlace, "id" | "created_at" | "updated_at"> = {
      place_id: reviewTarget.place_id,
      name: reviewTarget.name,
      address: reviewTarget.address,
      cuisine_type: data.cuisine_type,
      google_rating: reviewTarget.google_rating,
      has_parking: data.has_parking,
      parking_type: data.parking_type,
      parking_distance_meters: data.parking_distance_meters,
      lat: reviewTarget.lat,
      lng: reviewTarget.lng,
      visited_at: data.visited_at,
      personal_rating: data.personal_rating || null,
      review_text: data.review_text || null,
      photo_url: reviewTarget.photo_url ?? null,
    };

    if (isSupabaseConfigured()) {
      if (editTarget) {
        await updateVisitedPlace(editTarget.id, {
          personal_rating: payload.personal_rating ?? undefined,
          review_text: payload.review_text ?? undefined,
          has_parking: payload.has_parking,
          parking_distance_meters: payload.parking_distance_meters,
          visited_at: payload.visited_at,
          cuisine_type: payload.cuisine_type,
        });
      } else {
        await upsertVisitedPlace(payload);
      }
      await loadVisited();
    } else {
      // LocalStorage fallback
      const existing = lsGetVisited();
      const idx = existing.findIndex((v) => v.place_id === payload.place_id);
      const now = new Date().toISOString();
      if (idx >= 0) {
        existing[idx] = { ...existing[idx], ...payload, updated_at: now };
      } else {
        existing.unshift({
          ...payload,
          id: `ls_${Date.now()}`,
          created_at: now,
          updated_at: now,
        });
      }
      lsSaveVisited(existing);
      setVisitedPlaces(existing);
    }

    setReviewTarget(null);
    setEditTarget(null);
  };

  const handleDeleteRecord = async () => {
    if (!editTarget) return;
    if (isSupabaseConfigured()) {
      await deleteVisitedPlace(editTarget.id);
      await loadVisited();
    } else {
      const updated = lsGetVisited().filter((v) => v.id !== editTarget.id);
      lsSaveVisited(updated);
      setVisitedPlaces(updated);
    }
    setReviewTarget(null);
    setEditTarget(null);
  };

  // ── Panel height (mobile bottom sheet) ────────────────────────────────────
  const panelHeightClass = {
    collapsed: "h-20",
    half: "h-[50vh]",
    full: "h-[85vh]",
  }[panelState];

  const cyclePanelState = () => {
    setPanelState((s) =>
      s === "collapsed" ? "half" : s === "half" ? "full" : "collapsed"
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="flex items-center gap-3 px-4 py-3 bg-white shadow-sm z-20">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: "var(--brand)" }}
        >
          <MapPin className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-gray-900 text-base leading-tight">下一餐吃什麼</h1>
          <p className="text-xs text-gray-400 truncate">台中美食 + 停車地圖</p>
        </div>
        <button
          onClick={handleLocate}
          className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
          title="定位到我的位置"
        >
          <LocateFixed className="w-4 h-4 text-gray-600" />
        </button>
      </header>

      {/* ── Desktop layout (md+): sidebar + map side by side ─────────────── */}
      <div className="flex-1 hidden md:flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-96 flex flex-col bg-gray-50 border-r border-gray-200 overflow-hidden">
          {/* Filter bar */}
          <FilterBar
            filters={filters}
            onChange={setFilters}
            onSearch={searchRestaurants}
            loading={loading}
          />

          {/* Tabs */}
          <div className="flex border-b border-gray-200 bg-white">
            <button
              onClick={() => setActiveTab("search")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors border-b-2 ${
                activeTab === "search"
                  ? "border-brand-500 text-brand-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
              style={activeTab === "search" ? { borderColor: "var(--brand)", color: "var(--brand)" } : {}}
            >
              <List className="w-4 h-4" />
              搜尋結果
            </button>
            <button
              onClick={() => setActiveTab("visited")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors border-b-2 relative ${
                activeTab === "visited"
                  ? "border-brand-500 text-brand-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
              style={activeTab === "visited" ? { borderColor: "var(--brand)", color: "var(--brand)" } : {}}
            >
              <Bookmark className="w-4 h-4" />
              去過的地方
              {visitedPlaces.length > 0 && (
                <span className="ml-1 text-xs bg-green-500 text-white rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {visitedPlaces.length > 9 ? "9+" : visitedPlaces.length}
                </span>
              )}
            </button>
          </div>

          {/* List content */}
          <div className="flex-1 overflow-y-auto p-3 scrollbar-thin">
            {activeTab === "search" ? (
              <RestaurantList
                restaurants={enrichedRestaurants}
                selectedRestaurant={selectedRestaurant}
                onSelect={(r) => {
                  setSelectedRestaurant(r);
                  setPanelState("half");
                }}
                onNavigate={handleNavigate}
                onRecord={handleOpenRecord}
                loading={loading}
                isDemoMode={!hasMapsKey}
              />
            ) : (
              <VisitedTab
                visitedPlaces={visitedPlaces}
                onNavigate={handleNavigate}
                onEdit={handleOpenEdit}
              />
            )}
          </div>
        </aside>

        {/* Map */}
        <main className="flex-1 relative">
          <Map
            restaurants={enrichedRestaurants}
            selectedRestaurant={selectedRestaurant}
            onRestaurantSelect={(r) => setSelectedRestaurant(r)}
            center={mapCenter}
            onCenterChange={setMapCenter}
          />
        </main>
      </div>

      {/* ── Mobile layout (<md): map + bottom sheet ────────────────────────── */}
      <div className="flex-1 md:hidden relative overflow-hidden">
        {/* Full-screen map */}
        <div className="absolute inset-0">
          <Map
            restaurants={enrichedRestaurants}
            selectedRestaurant={selectedRestaurant}
            onRestaurantSelect={(r) => {
              setSelectedRestaurant(r);
              setActiveTab("search");
              setPanelState("half");
            }}
            center={mapCenter}
            onCenterChange={setMapCenter}
            isMobile={true}
          />
        </div>

        {/* Bottom sheet */}
        <div
          className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl transition-all duration-300 flex flex-col ${panelHeightClass}`}
        >
          {/* Sheet handle + tabs */}
          <div
            className="flex flex-col items-center pt-2 pb-0 cursor-pointer"
            onClick={cyclePanelState}
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mb-2" />
          </div>

          {/* Filter bar (only when panel is open) */}
          {panelState !== "collapsed" && (
            <FilterBar
              filters={filters}
              onChange={setFilters}
              onSearch={() => {
                searchRestaurants();
                setPanelState("half");
              }}
              loading={loading}
            />
          )}

          {/* Tabs */}
          {panelState !== "collapsed" && (
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab("search")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "search"
                    ? "border-brand-500"
                    : "border-transparent text-gray-500"
                }`}
                style={activeTab === "search" ? { borderColor: "var(--brand)", color: "var(--brand)" } : {}}
              >
                <List className="w-4 h-4" />
                搜尋
              </button>
              <button
                onClick={() => setActiveTab("visited")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium border-b-2 transition-colors relative ${
                  activeTab === "visited"
                    ? "border-brand-500"
                    : "border-transparent text-gray-500"
                }`}
                style={activeTab === "visited" ? { borderColor: "var(--brand)", color: "var(--brand)" } : {}}
              >
                <Bookmark className="w-4 h-4" />
                去過
                {visitedPlaces.length > 0 && (
                  <span className="ml-1 text-xs bg-green-500 text-white rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {visitedPlaces.length > 9 ? "9+" : visitedPlaces.length}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Collapsed pill */}
          {panelState === "collapsed" && (
            <div className="flex items-center justify-center gap-2 py-2 text-sm text-gray-600">
              <ChevronUp className="w-4 h-4" />
              <span>查看餐廳列表</span>
            </div>
          )}

          {/* List */}
          {panelState !== "collapsed" && (
            <div className="flex-1 overflow-y-auto p-3 scrollbar-thin">
              {activeTab === "search" ? (
                <RestaurantList
                  restaurants={enrichedRestaurants}
                  selectedRestaurant={selectedRestaurant}
                  onSelect={(r) => setSelectedRestaurant(r)}
                  onNavigate={handleNavigate}
                  onRecord={handleOpenRecord}
                  loading={loading}
                  isDemoMode={!hasMapsKey}
                />
              ) : (
                <VisitedTab
                  visitedPlaces={visitedPlaces}
                  onNavigate={handleNavigate}
                  onEdit={handleOpenEdit}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Review / Record Modal ─────────────────────────────────────────── */}
      {reviewTarget && (
        <ReviewModal
          restaurant={reviewTarget}
          visitedRecord={editTarget}
          onSave={handleSaveReview}
          onDelete={editTarget ? handleDeleteRecord : undefined}
          onClose={() => {
            setReviewTarget(null);
            setEditTarget(null);
          }}
        />
      )}
    </div>
  );
}
