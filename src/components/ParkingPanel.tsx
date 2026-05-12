"use client";

import type { ParkingLot } from "@/types";
import { X, Navigation2, MapPin, Loader2 } from "lucide-react";

interface ParkingPanelProps {
  parkingLots: ParkingLot[];
  loading: boolean;
  restaurantName: string;
  onNavigate: (lot: ParkingLot) => void;
  onClose: () => void;
}

function DistanceBadge({ meters }: { meters: number }) {
  const label = meters < 1000 ? `${meters}m` : `${(meters / 1000).toFixed(1)}km`;
  const color =
    meters <= 200
      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
      : meters <= 500
      ? "text-blue-700 bg-blue-50 border-blue-200"
      : "text-orange-700 bg-orange-50 border-orange-200";
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${color}`}>
      {label}
    </span>
  );
}

export default function ParkingPanel({
  parkingLots,
  loading,
  restaurantName,
  onNavigate,
  onClose,
}: ParkingPanelProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 shrink-0">
        <span className="text-lg">🅿️</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900">附近停車場</p>
          <p className="text-xs text-gray-400 truncate">距離「{restaurantName}」</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
            <Loader2 className="w-7 h-7 animate-spin" style={{ color: "var(--brand)" }} />
            <p className="text-sm">正在搜尋附近停車場…</p>
          </div>
        ) : parkingLots.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
            <span className="text-4xl">🅿️</span>
            <p className="text-sm">附近 1km 內未找到停車場</p>
            <p className="text-xs text-gray-400">可嘗試直接導航，Google Maps 會自動顯示停車場</p>
          </div>
        ) : (
          parkingLots.map((lot) => (
            <div
              key={lot.place_id}
              className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm flex items-start gap-3"
            >
              {/* Icon */}
              <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                <span className="text-base">🅿️</span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-gray-900 truncate">{lot.name}</p>
                  <DistanceBadge meters={lot.distance_meters} />
                </div>
                <div className="flex items-start gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-gray-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-gray-500 line-clamp-1">{lot.address}</p>
                </div>
                {lot.is_open !== undefined && (
                  <p className={`text-xs font-semibold mt-0.5 ${lot.is_open ? "text-green-600" : "text-red-500"}`}>
                    {lot.is_open ? "● 開放中" : "○ 目前關閉"}
                  </p>
                )}
              </div>

              {/* Navigate button */}
              <button
                onClick={() => onNavigate(lot)}
                className="shrink-0 flex items-center gap-1 text-xs font-semibold text-white rounded-lg px-2.5 py-2 transition-colors"
                style={{ backgroundColor: "var(--brand)" }}
              >
                <Navigation2 className="w-3.5 h-3.5" />
                導航
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer hint */}
      {!loading && parkingLots.length > 0 && (
        <div className="px-4 py-2.5 border-t border-gray-100 shrink-0">
          <p className="text-xs text-center text-gray-400">
            共找到 {parkingLots.length} 個停車場 · 藍色 P 標記已顯示於地圖
          </p>
        </div>
      )}
    </div>
  );
}
