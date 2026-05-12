"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import type { Restaurant, VisitedPlace, SearchFilters, LatLng, ParkingLot, FavoritePlace } from "@/types";
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
  getFavorites,
  addFavorite,
  removeFavorite,
  lsGetFavorites,
  lsSaveFavorites,
} from "@/lib/supabase";
import FilterBar from "@/components/FilterBar";
import RestaurantList from "@/components/RestaurantList";
import VisitedTab from "@/components/VisitedTab";
import ReviewModal, { type ReviewFormData } from "@/components/ReviewModal";
import ParkingPanel from "@/components/ParkingPanel";
import FavoritesTab from "@/components/FavoritesTab";
import BrandFooter from "@/components/BrandFooter";
import { MapPin, List, Bookmark, Heart, LocateFixed, ChevronUp, Home, Building2, Briefcase } from "lucide-react";

const QUICK_DESTINATIONS = [
  {
    label: "回家",
    address: "南投縣鹿谷鄉鹿谷村六合街177號",
    icon: Home,
    color: "text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100",
  },
  {
    label: "回宿舍",
    address: "403臺中市西區公民里五廊街102之6號",
    icon: Building2,
    color: "text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100",
  },
  {
    label: "回公司",
    address: "403台中市西區美村路一段216號",
    icon: Briefcase,
    color: "text-purple-700 bg-purple-50 border-purple-200 hover:bg-purple-100",
  },
] as const;

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

type Tab = "search" | "visited" | "favorites";
type PanelState = "collapsed" | "half" | "full";

export default function HomePage() {
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [visitedPlaces, setVisitedPlaces] = useState<VisitedPlace[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [mapCenter, setMapCenter] = useState<LatLng>(TAICHUNG_CENTER);
  const [activeTab, setActiveTab] = useState<Tab>("search");
  const [loading, setLoading] = useState(false);
  const [searchDebug, setSearchDebug] = useState<string | null>(null);
  const [reviewTarget, setReviewTarget] = useState<Restaurant | null>(null);
  const [editTarget, setEditTarget] = useState<VisitedPlace | null>(null);
  const [panelState, setPanelState] = useState<PanelState>("half");
  const [hasMapsKey] = useState(() => !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);

  // Favorites state
  const [favorites, setFavorites] = useState<FavoritePlace[]>([]);

  // Parking state
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const [parkingLoading, setParkingLoading] = useState(false);
  const [showParkingPanel, setShowParkingPanel] = useState(false);
  const [parkingTarget, setParkingTarget] = useState<Restaurant | null>(null);

  // Merge visited + favorite status into restaurants
  const enrichedRestaurants = restaurants.map((r) => {
    const visited = visitedPlaces.find((v) => v.place_id === r.place_id);
    const isFav = favorites.some((f) => f.place_id === r.place_id);
    return {
      ...r,
      is_favorite: isFav,
      ...(visited
        ? {
            is_visited: true,
            visited_id: visited.id,
            personal_rating: visited.personal_rating ?? undefined,
            review_text: visited.review_text ?? undefined,
            has_parking: visited.has_parking,
            parking_distance_meters: visited.parking_distance_meters ?? undefined,
          }
        : {}),
    };
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

  const loadFavorites = useCallback(async () => {
    if (isSupabaseConfigured()) {
      setFavorites(await getFavorites());
    } else {
      setFavorites(lsGetFavorites());
    }
  }, []);

  const handleToggleFavorite = async (restaurant: Restaurant) => {
    const already = favorites.some((f) => f.place_id === restaurant.place_id);
    if (already) {
      // Remove
      if (isSupabaseConfigured()) {
        await removeFavorite(restaurant.place_id);
        await loadFavorites();
      } else {
        const updated = lsGetFavorites().filter((f) => f.place_id !== restaurant.place_id);
        lsSaveFavorites(updated);
        setFavorites(updated);
      }
    } else {
      // Add
      const payload: Omit<FavoritePlace, "id" | "created_at"> = {
        place_id: restaurant.place_id,
        name: restaurant.name,
        address: restaurant.address,
        cuisine_type: restaurant.cuisine_type,
        google_rating: restaurant.google_rating,
        lat: restaurant.lat,
        lng: restaurant.lng,
        photo_url: restaurant.photo_url ?? null,
        price_level: restaurant.price_level ?? null,
      };
      if (isSupabaseConfigured()) {
        await addFavorite(payload);
        await loadFavorites();
      } else {
        const now = new Date().toISOString();
        const newFav: FavoritePlace = { ...payload, id: `ls_fav_${Date.now()}`, created_at: now };
        const updated = [newFav, ...lsGetFavorites()];
        lsSaveFavorites(updated);
        setFavorites(updated);
      }
    }
  };

  const handleRemoveFavorite = async (place_id: string) => {
    if (isSupabaseConfigured()) {
      await removeFavorite(place_id);
      await loadFavorites();
    } else {
      const updated = lsGetFavorites().filter((f) => f.place_id !== place_id);
      lsSaveFavorites(updated);
      setFavorites(updated);
    }
  };

  const handleNavigateFavorite = (place: FavoritePlace) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}&destination_place_id=${place.place_id}&travelmode=driving`;
    const a = document.createElement("a");
    a.href = url; a.target = "_blank"; a.rel = "noopener noreferrer";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

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
      const list: Restaurant[] = json.restaurants ?? [];
      setRestaurants(list);
      // Show debug info when keyword search returns nothing
      if (filters.keyword && list.length === 0 && json._debug) {
        const d = json._debug;
        setSearchDebug(
          d.apiError
            ? `API錯誤 (${d.httpStatus}): ${d.apiError}`
            : `搜尋模式: ${d.mode} | 查詢: "${d.query}" | Google回傳: ${d.rawCount} 筆 | 過濾後: ${d.finalCount} 筆`
        );
      } else {
        setSearchDebug(null);
      }
    } catch (err) {
      console.error("[searchRestaurants]", err);
    } finally {
      setLoading(false);
    }
  }, [hasMapsKey, filters, mapCenter]);

  useEffect(() => {
    loadVisited();
    loadFavorites();
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

  // ── Quick destination navigation ───────────────────────────────────────────
  const handleQuickNav = (address: string) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}&travelmode=driving`;
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // ── Navigation ─────────────────────────────────────────────────────────────
  const handleNavigate = (target: Restaurant | VisitedPlace) => {
    const { lat, lng } = target;
    const placeId = (target as Restaurant).place_id ?? "";
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}${placeId ? `&destination_place_id=${placeId}` : ""}&travelmode=driving`;
    // Use anchor click to avoid popup blocker
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // ── Find Parking ───────────────────────────────────────────────────────────
  const handleFindParking = async (restaurant: Restaurant) => {
    setParkingTarget(restaurant);
    setShowParkingPanel(true);
    setParkingLots([]);
    setParkingLoading(true);
    // On mobile, expand panel so ParkingPanel is visible
    setPanelState("half");
    try {
      const params = new URLSearchParams({
        lat: String(restaurant.lat),
        lng: String(restaurant.lng),
        radius: "800",
      });
      const res = await fetch(`/api/parking?${params}`);
      const json = await res.json();
      setParkingLots(json.parking ?? []);
    } catch (err) {
      console.error("[handleFindParking]", err);
      setParkingLots([]);
    } finally {
      setParkingLoading(false);
    }
  };

  const handleCloseParkingPanel = () => {
    setShowParkingPanel(false);
    setParkingLots([]);
    setParkingTarget(null);
  };

  const handleNavigateParkingLot = (lot: ParkingLot) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lot.lat},${lot.lng}&destination_place_id=${lot.place_id}&travelmode=driving`;
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
      <header className="bg-white shadow-sm z-20">
        {/* Row 1: Logo + title + locate */}
        <div className="flex items-center gap-3 px-4 pt-3 pb-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: "var(--brand)" }}
          >
            <MapPin className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-gray-900 text-base leading-tight">等等吃什麼</h1>
            <p className="text-xs text-gray-400 truncate">
              台中美食 + 停車地圖
              <span className="hidden sm:inline text-gray-300"> · Powered by Lukuarts Studio</span>
            </p>
          </div>
          <button
            onClick={handleLocate}
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
            title="定位到我的位置"
          >
            <LocateFixed className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Row 2: Quick destination buttons */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-none">
          {QUICK_DESTINATIONS.map(({ label, address, icon: Icon, color }) => (
            <button
              key={label}
              onClick={() => handleQuickNav(address)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors shrink-0 ${color}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
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
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors border-b-2"
              style={activeTab === "search" ? { borderColor: "var(--brand)", color: "var(--brand)" } : { borderColor: "transparent", color: "#6b7280" }}
            >
              <List className="w-4 h-4" />
              搜尋
            </button>
            <button
              onClick={() => setActiveTab("favorites")}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors border-b-2 relative"
              style={activeTab === "favorites" ? { borderColor: "var(--brand)", color: "var(--brand)" } : { borderColor: "transparent", color: "#6b7280" }}
            >
              <Heart className="w-4 h-4" />
              最愛
              {favorites.length > 0 && (
                <span className="ml-1 text-xs bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {favorites.length > 9 ? "9+" : favorites.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("visited")}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors border-b-2 relative"
              style={activeTab === "visited" ? { borderColor: "var(--brand)", color: "var(--brand)" } : { borderColor: "transparent", color: "#6b7280" }}
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

          {/* List content */}
          <div className="flex-1 overflow-y-auto p-3 scrollbar-thin">
            {showParkingPanel ? (
              <ParkingPanel
                parkingLots={parkingLots}
                loading={parkingLoading}
                restaurantName={parkingTarget?.name ?? ""}
                onNavigate={handleNavigateParkingLot}
                onClose={handleCloseParkingPanel}
              />
            ) : activeTab === "search" ? (
              <RestaurantList
                restaurants={enrichedRestaurants}
                selectedRestaurant={selectedRestaurant}
                onSelect={(r) => {
                  setSelectedRestaurant(r);
                  setPanelState("half");
                }}
                onNavigate={handleNavigate}
                onRecord={handleOpenRecord}
                onFindParking={hasMapsKey ? handleFindParking : undefined}
                onFavorite={handleToggleFavorite}
                loading={loading}
                isDemoMode={!hasMapsKey}
                debugMessage={searchDebug}
              />
            ) : activeTab === "favorites" ? (
              <FavoritesTab
                favorites={favorites}
                onNavigate={handleNavigateFavorite}
                onRemove={handleRemoveFavorite}
              />
            ) : (
              <VisitedTab
                visitedPlaces={visitedPlaces}
                onNavigate={handleNavigate}
                onEdit={handleOpenEdit}
              />
            )}
          </div>

          {/* Brand footer — desktop sidebar */}
          <BrandFooter />
        </aside>

        {/* Map */}
        <main className="flex-1 relative">
          <Map
            restaurants={enrichedRestaurants}
            selectedRestaurant={selectedRestaurant}
            onRestaurantSelect={(r) => {
              setSelectedRestaurant(r);
              setShowParkingPanel(false);
            }}
            center={mapCenter}
            onCenterChange={setMapCenter}
            parkingLots={parkingLots}
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
              setShowParkingPanel(false);
            }}
            center={mapCenter}
            onCenterChange={setMapCenter}
            isMobile={true}
            parkingLots={parkingLots}
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
                className="flex-1 flex items-center justify-center gap-1 py-2.5 text-xs font-medium border-b-2 transition-colors"
                style={activeTab === "search" ? { borderColor: "var(--brand)", color: "var(--brand)" } : { borderColor: "transparent", color: "#6b7280" }}
              >
                <List className="w-3.5 h-3.5" />搜尋
              </button>
              <button
                onClick={() => setActiveTab("favorites")}
                className="flex-1 flex items-center justify-center gap-1 py-2.5 text-xs font-medium border-b-2 transition-colors relative"
                style={activeTab === "favorites" ? { borderColor: "var(--brand)", color: "var(--brand)" } : { borderColor: "transparent", color: "#6b7280" }}
              >
                <Heart className="w-3.5 h-3.5" />最愛
                {favorites.length > 0 && (
                  <span className="ml-0.5 text-xs bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {favorites.length > 9 ? "9+" : favorites.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("visited")}
                className="flex-1 flex items-center justify-center gap-1 py-2.5 text-xs font-medium border-b-2 transition-colors relative"
                style={activeTab === "visited" ? { borderColor: "var(--brand)", color: "var(--brand)" } : { borderColor: "transparent", color: "#6b7280" }}
              >
                <Bookmark className="w-3.5 h-3.5" />去過
                {visitedPlaces.length > 0 && (
                  <span className="ml-0.5 text-xs bg-green-500 text-white rounded-full w-4 h-4 flex items-center justify-center font-bold">
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
              {showParkingPanel ? (
                <ParkingPanel
                  parkingLots={parkingLots}
                  loading={parkingLoading}
                  restaurantName={parkingTarget?.name ?? ""}
                  onNavigate={handleNavigateParkingLot}
                  onClose={handleCloseParkingPanel}
                />
              ) : activeTab === "search" ? (
                <RestaurantList
                  restaurants={enrichedRestaurants}
                  selectedRestaurant={selectedRestaurant}
                  onSelect={(r) => setSelectedRestaurant(r)}
                  onNavigate={handleNavigate}
                  onRecord={handleOpenRecord}
                  onFindParking={hasMapsKey ? handleFindParking : undefined}
                  onFavorite={handleToggleFavorite}
                  loading={loading}
                  isDemoMode={!hasMapsKey}
                  debugMessage={searchDebug}
                />
              ) : activeTab === "favorites" ? (
                <FavoritesTab
                  favorites={favorites}
                  onNavigate={handleNavigateFavorite}
                  onRemove={handleRemoveFavorite}
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

          {/* Brand footer — mobile bottom sheet */}
          {panelState !== "collapsed" && <BrandFooter />}
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
