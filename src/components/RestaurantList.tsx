"use client";

import type { Restaurant } from "@/types";
import RestaurantCard from "./RestaurantCard";
import { UtensilsCrossed, Loader2 } from "lucide-react";

interface RestaurantListProps {
  restaurants: Restaurant[];
  selectedRestaurant: Restaurant | null;
  onSelect: (restaurant: Restaurant) => void;
  onNavigate: (restaurant: Restaurant) => void;
  onRecord: (restaurant: Restaurant) => void;
  onFindParking?: (restaurant: Restaurant) => void;
  onFavorite?: (restaurant: Restaurant) => void;
  loading: boolean;
  isDemoMode: boolean;
  debugMessage?: string | null;
}

export default function RestaurantList({
  restaurants,
  selectedRestaurant,
  onSelect,
  onNavigate,
  onRecord,
  onFindParking,
  onFavorite,
  loading,
  isDemoMode,
  debugMessage,
}: RestaurantListProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-3">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--brand)" }} />
        <p className="text-sm text-gray-500">搜尋附近餐廳中...</p>
      </div>
    );
  }

  if (restaurants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 text-center px-4 py-8">
        <UtensilsCrossed className="w-8 h-8 text-gray-300" />
        <div>
          <p className="text-sm font-medium text-gray-500">找不到符合條件的餐廳</p>
          <p className="text-xs text-gray-400 mt-1">試著調整篩選條件或擴大搜尋範圍</p>
        </div>
        {debugMessage && (
          <div className="mt-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-xl text-left w-full">
            <p className="text-xs font-semibold text-yellow-800 mb-1">🔍 診斷資訊</p>
            <p className="text-xs text-yellow-700 break-all">{debugMessage}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {isDemoMode && (
        <div className="mx-1 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
          🔑 Demo 模式 — 顯示範例資料。設定 Google Maps API Key 後可搜尋真實餐廳。
        </div>
      )}
      <p className="text-xs text-gray-400 ml-1">找到 {restaurants.length} 間餐廳</p>
      {restaurants.map((restaurant) => (
        <RestaurantCard
          key={restaurant.place_id}
          restaurant={restaurant}
          isSelected={selectedRestaurant?.place_id === restaurant.place_id}
          onClick={() => onSelect(restaurant)}
          onNavigate={onNavigate}
          onRecord={onRecord}
          onFindParking={onFindParking}
          onFavorite={onFavorite}
        />
      ))}
    </div>
  );
}
