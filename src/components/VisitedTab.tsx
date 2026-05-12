"use client";

import type { VisitedPlace } from "@/types";
import {
  MapPin,
  Star,
  ParkingCircle,
  Car,
  Navigation2,
  Edit3,
  BookmarkX,
  CalendarDays,
} from "lucide-react";

interface VisitedTabProps {
  visitedPlaces: VisitedPlace[];
  onNavigate: (place: VisitedPlace) => void;
  onEdit: (place: VisitedPlace) => void;
}

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${
            i <= rating ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"
          }`}
        />
      ))}
    </span>
  );
}

export default function VisitedTab({
  visitedPlaces,
  onNavigate,
  onEdit,
}: VisitedTabProps) {
  if (visitedPlaces.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3 text-center px-4">
        <BookmarkX className="w-10 h-10 text-gray-300" />
        <div>
          <p className="text-sm font-medium text-gray-500">還沒有去過的紀錄</p>
          <p className="text-xs text-gray-400 mt-1">搜尋餐廳後，點選「記錄去過」開始收藏</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-gray-400 ml-1">共 {visitedPlaces.length} 筆紀錄</p>
      {visitedPlaces.map((place) => (
        <div key={place.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          {/* Name + cuisine */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm truncate">{place.name}</h3>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full mt-0.5 inline-block">
                {place.cuisine_type}
              </span>
            </div>
            <button
              onClick={() => onEdit(place)}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
            >
              <Edit3 className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Date visited */}
          <div className="flex items-center gap-1.5 mt-2">
            <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs text-gray-500">
              {new Date(place.visited_at).toLocaleDateString("zh-TW", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>

          {/* Google rating */}
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs text-gray-400">Google:</span>
            <span className="text-sm font-bold text-amber-500">{place.google_rating}</span>
          </div>

          {/* Personal rating */}
          {place.personal_rating && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-400">我的評分:</span>
              <StarRow rating={place.personal_rating} />
            </div>
          )}

          {/* Review text */}
          {place.review_text && (
            <p className="text-xs text-gray-600 mt-2 bg-gray-50 rounded-lg p-2.5 italic line-clamp-3">
              "{place.review_text}"
            </p>
          )}

          {/* Parking */}
          <div className="mt-2">
            {place.has_parking ? (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                <ParkingCircle className="w-3 h-3" />
                自有停車場
              </span>
            ) : place.parking_distance_meters ? (
              <span className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                <Car className="w-3 h-3" />
                {place.parking_distance_meters}m 內有停車場
              </span>
            ) : null}
          </div>

          {/* Address + navigate */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-start gap-1 flex-1 min-w-0">
              <MapPin className="w-3 h-3 text-gray-400 mt-0.5 shrink-0" />
              <p className="text-xs text-gray-500 truncate">{place.address}</p>
            </div>
            <button
              onClick={() => onNavigate(place)}
              className="shrink-0 flex items-center gap-1 text-xs font-medium text-white px-3 py-1.5 rounded-lg transition-colors"
              style={{ backgroundColor: "var(--brand)" }}
            >
              <Navigation2 className="w-3 h-3" />
              導航
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
