"use client";

import type { Restaurant } from "@/types";
import { PRICE_LEVEL_INFO, PARKING_TYPE_INFO } from "@/types";
import { Star, MapPin, Navigation2, BookmarkPlus, BookmarkCheck, ChevronRight, ParkingSquare } from "lucide-react";

interface RestaurantCardProps {
  restaurant: Restaurant;
  isSelected: boolean;
  onClick: () => void;
  onNavigate: (r: Restaurant) => void;
  onRecord:   (r: Restaurant) => void;
  onFindParking?: (r: Restaurant) => void;
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`w-3 h-3 ${i <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}`} />
      ))}
    </span>
  );
}

export default function RestaurantCard({ restaurant, isSelected, onClick, onNavigate, onRecord, onFindParking }: RestaurantCardProps) {
  const { name, address, google_rating, total_ratings, cuisine_type,
          parking_types, has_parking, is_open, is_visited,
          personal_rating, price_level } = restaurant;

  const priceInfo = price_level ? PRICE_LEVEL_INFO[price_level] : null;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-3.5 cursor-pointer transition-all border-2 ${
        isSelected ? "shadow-lg" : "border-transparent shadow-sm hover:shadow-md hover:border-gray-200"
      }`}
      style={isSelected ? { borderColor: "var(--brand)" } : {}}
    >
      {/* Name row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">{name}</h3>
            {is_visited && (
              <span className="inline-flex items-center gap-0.5 text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full shrink-0">
                <BookmarkCheck className="w-3 h-3" />去過
              </span>
            )}
          </div>

          {/* Tags row */}
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{cuisine_type}</span>
            {priceInfo && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${priceInfo.color}`}>
                {priceInfo.range}/人
              </span>
            )}
            {is_open !== undefined && (
              <span className={`text-xs font-semibold ${is_open ? "text-green-600" : "text-red-500"}`}>
                {is_open ? "● 營業中" : "○ 休息中"}
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 mt-1" />
      </div>

      {/* Rating row */}
      <div className="flex items-center gap-2 mt-2">
        <Stars rating={google_rating} />
        <span className="text-sm font-bold text-amber-500">{google_rating}</span>
        {total_ratings && <span className="text-xs text-gray-400">({total_ratings.toLocaleString()})</span>}
        {personal_rating && (
          <span className="ml-auto text-xs text-purple-600 font-medium">我的 {personal_rating}★</span>
        )}
      </div>

      {/* Address */}
      <div className="flex items-start gap-1 mt-1.5">
        <MapPin className="w-3 h-3 text-gray-400 mt-0.5 shrink-0" />
        <p className="text-xs text-gray-500 line-clamp-1">{address}</p>
      </div>

      {/* Parking */}
      <div className="flex flex-wrap gap-1.5 mt-1.5">
        {parking_types && parking_types.length > 0 ? (
          parking_types.map(pt => {
            const info = PARKING_TYPE_INFO[pt];
            return (
              <span key={pt} className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${info.color}`}>
                {info.icon} {pt}
              </span>
            );
          })
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-200">
            🅿️ 停車待記錄
          </span>
        )}
      </div>

      {/* Action buttons (only when selected) */}
      {isSelected && (
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
          {/* Row 1: Navigate + Record */}
          <div className="flex gap-2">
            <button
              onClick={e => { e.stopPropagation(); onNavigate(restaurant); }}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-white rounded-xl py-2.5 transition-colors"
              style={{ backgroundColor: "var(--brand)" }}
            >
              <Navigation2 className="w-3.5 h-3.5" />導航
            </button>
            <button
              onClick={e => { e.stopPropagation(); onRecord(restaurant); }}
              className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold rounded-xl py-2.5 transition-colors border ${
                is_visited ? "border-green-300 text-green-700 bg-green-50" : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
              }`}
            >
              {is_visited ? <><BookmarkCheck className="w-3.5 h-3.5" />查看紀錄</> : <><BookmarkPlus className="w-3.5 h-3.5" />記錄去過</>}
            </button>
          </div>
          {/* Row 2: Find Parking */}
          {onFindParking && (
            <button
              onClick={e => { e.stopPropagation(); onFindParking(restaurant); }}
              className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl py-2.5 transition-colors border border-blue-200"
            >
              <ParkingSquare className="w-3.5 h-3.5" />尋找最近車位
            </button>
          )}
        </div>
      )}
    </div>
  );
}
