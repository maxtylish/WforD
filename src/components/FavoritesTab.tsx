"use client";

import type { FavoritePlace } from "@/types";
import { PRICE_LEVEL_INFO } from "@/types";
import { MapPin, Navigation2, Heart, HeartOff, Star } from "lucide-react";

interface FavoritesTabProps {
  favorites: FavoritePlace[];
  onNavigate: (place: FavoritePlace) => void;
  onRemove: (place_id: string) => void;
}

export default function FavoritesTab({ favorites, onNavigate, onRemove }: FavoritesTabProps) {
  if (favorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3 text-center px-4">
        <Heart className="w-10 h-10 text-gray-200" />
        <div>
          <p className="text-sm font-medium text-gray-500">還沒有收藏的餐廳</p>
          <p className="text-xs text-gray-400 mt-1">點擊餐廳卡片上的 ♡ 加入最愛</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-gray-400 ml-1">共 {favorites.length} 間最愛餐廳</p>
      {favorites.map((place) => {
        const priceInfo = place.price_level ? PRICE_LEVEL_INFO[place.price_level] : null;
        return (
          <div key={place.id} className="bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100">
            {/* Header row */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm truncate">{place.name}</h3>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {place.cuisine_type}
                  </span>
                  {priceInfo && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${priceInfo.color}`}>
                      {priceInfo.range}/人
                    </span>
                  )}
                </div>
              </div>
              {/* Remove button */}
              <button
                onClick={() => onRemove(place.place_id)}
                className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors shrink-0"
                title="移除最愛"
              >
                <HeartOff className="w-4 h-4" />
              </button>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-1.5 mt-2">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="text-sm font-bold text-amber-500">{place.google_rating}</span>
            </div>

            {/* Address + navigate */}
            <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-gray-100">
              <div className="flex items-start gap-1 flex-1 min-w-0">
                <MapPin className="w-3 h-3 text-gray-400 mt-0.5 shrink-0" />
                <p className="text-xs text-gray-500 truncate">{place.address}</p>
              </div>
              <button
                onClick={() => onNavigate(place)}
                className="shrink-0 flex items-center gap-1 text-xs font-semibold text-white px-3 py-1.5 rounded-lg transition-colors"
                style={{ backgroundColor: "var(--brand)" }}
              >
                <Navigation2 className="w-3 h-3" />
                導航
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
