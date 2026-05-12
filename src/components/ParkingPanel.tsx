"use client";

import type { ParkingLot } from "@/types";
import { X, Navigation2, MapPin, Loader2, Star, ExternalLink } from "lucide-react";

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
    meters <= 200 ? "text-emerald-700 bg-emerald-50 border-emerald-200" :
    meters <= 500 ? "text-blue-700 bg-blue-50 border-blue-200" :
                   "text-orange-700 bg-orange-50 border-orange-200";
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${color}`}>
      {label}
    </span>
  );
}

function PriceBadge({ level }: { level?: number }) {
  if (level === undefined) return null;
  const info: Record<number, { label: string; color: string }> = {
    0: { label: "免費",   color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
    1: { label: "便宜",   color: "text-blue-700 bg-blue-50 border-blue-200" },
    2: { label: "適中",   color: "text-orange-700 bg-orange-50 border-orange-200" },
    3: { label: "較貴",   color: "text-red-700 bg-red-50 border-red-200" },
  };
  const p = info[level];
  if (!p) return null;
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${p.color}`}>
      💰 {p.label}
    </span>
  );
}

function openGoogleMapsPlace(placeId: string, name: string) {
  const url = `https://www.google.com/maps/place/?q=place_id:${placeId}`;
  const a = document.createElement("a");
  a.href = url; a.target = "_blank"; a.rel = "noopener noreferrer";
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
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

      {/* Availability notice */}
      {!loading && parkingLots.length > 0 && (
        <div className="mx-3 mt-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-xs text-amber-700">
            ⚠️ Google 未提供即時空位數量。點「查看空位」可開 Google Maps 查詢部分停車場的即時資訊。
          </p>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 mt-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
            <Loader2 className="w-7 h-7 animate-spin" style={{ color: "var(--brand)" }} />
            <p className="text-sm">正在搜尋附近停車場…</p>
          </div>
        ) : parkingLots.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
            <span className="text-4xl">🅿️</span>
            <p className="text-sm">附近 1km 內未找到停車場</p>
            <p className="text-xs text-gray-400 text-center">可嘗試直接導航，Google Maps 會自動顯示停車場</p>
          </div>
        ) : (
          parkingLots.map((lot) => (
            <div
              key={lot.place_id}
              className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm"
            >
              {/* Row 1: Icon + name + distance */}
              <div className="flex items-start gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                  <span className="text-base">🅿️</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 leading-tight">{lot.name}</p>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <DistanceBadge meters={lot.distance_meters} />
                    <PriceBadge level={lot.price_level} />
                    {/* Open/closed status */}
                    {lot.is_open !== undefined && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                        lot.is_open
                          ? "text-green-700 bg-green-50 border-green-200"
                          : "text-red-600 bg-red-50 border-red-200"
                      }`}>
                        {lot.is_open ? "● 開放中" : "○ 已關閉"}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Row 2: Rating + address */}
              <div className="mt-2 space-y-1">
                {/* Google rating */}
                {lot.google_rating ? (
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-0.5">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} className={`w-3 h-3 ${i <= Math.round(lot.google_rating!) ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}`} />
                      ))}
                    </div>
                    <span className="text-sm font-bold text-amber-500">{lot.google_rating.toFixed(1)}</span>
                    {lot.total_ratings && (
                      <span className="text-xs text-gray-400">({lot.total_ratings.toLocaleString()}則評價)</span>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">尚無 Google 評價</p>
                )}
                {/* Address */}
                <div className="flex items-start gap-1">
                  <MapPin className="w-3 h-3 text-gray-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-gray-500 line-clamp-1">{lot.address}</p>
                </div>
              </div>

              {/* Row 3: Action buttons */}
              <div className="flex gap-1.5 mt-2.5 pt-2.5 border-t border-gray-100">
                {/* Navigate */}
                <button
                  onClick={() => onNavigate(lot)}
                  className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold text-white rounded-lg py-2 transition-colors"
                  style={{ backgroundColor: "var(--brand)" }}
                >
                  <Navigation2 className="w-3.5 h-3.5" />導航前往
                </button>
                {/* Check availability on Google Maps */}
                <button
                  onClick={() => openGoogleMapsPlace(lot.place_id, lot.name)}
                  className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg py-2 transition-colors border border-blue-200"
                >
                  <ExternalLink className="w-3.5 h-3.5" />查看空位
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
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
