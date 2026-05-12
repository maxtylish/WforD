"use client";

import { useState, useEffect } from "react";
import type { Restaurant, VisitedPlace, CuisineType, ParkingType } from "@/types";
import { CUISINE_TYPES, PARKING_TYPES, PARKING_TYPE_INFO } from "@/types";
import { X, Star, Trash2, Save } from "lucide-react";

interface ReviewModalProps {
  restaurant: Restaurant;
  visitedRecord?: VisitedPlace | null;
  onSave: (data: ReviewFormData) => Promise<void>;
  onDelete?: () => Promise<void>;
  onClose: () => void;
}

export interface ReviewFormData {
  personal_rating: number;
  review_text: string;
  has_parking: boolean;
  parking_type: ParkingType | null;
  parking_distance_meters: number | null;
  cuisine_type: CuisineType;
  visited_at: string;
}

export default function ReviewModal({ restaurant, visitedRecord, onSave, onDelete, onClose }: ReviewModalProps) {
  const [rating, setRating] = useState(visitedRecord?.personal_rating ?? 0);
  const [hover, setHover] = useState(0);
  const [reviewText, setReviewText] = useState(visitedRecord?.review_text ?? "");
  const [parkingType, setParkingType] = useState<ParkingType | null>(
    visitedRecord?.parking_type ?? (restaurant.parking_types?.[0] ?? null)
  );
  const [parkingDist, setParkingDist] = useState(
    String(visitedRecord?.parking_distance_meters ?? restaurant.parking_distance_meters ?? "")
  );
  const [cuisineType, setCuisineType] = useState<CuisineType>(
    visitedRecord?.cuisine_type ?? restaurant.cuisine_type ?? "其他"
  );
  const [visitedAt, setVisitedAt] = useState(
    visitedRecord?.visited_at
      ? visitedRecord.visited_at.split("T")[0]
      : new Date().toISOString().split("T")[0]
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const hasParking = parkingType !== null && parkingType !== "無停車";

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        personal_rating: rating,
        review_text: reviewText,
        has_parking: hasParking,
        parking_type: parkingType,
        parking_distance_meters: parkingDist ? parseInt(parkingDist) : null,
        cuisine_type: cuisineType,
        visited_at: new Date(visitedAt).toISOString(),
      });
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!onDelete || !confirm("確定要刪除這筆紀錄嗎？")) return;
    setDeleting(true);
    try { await onDelete(); } finally { setDeleting(false); }
  };

  const STAR_LABELS = ["", "很差", "還好", "普通", "好吃", "超讚！"];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-lg sm:mx-4 rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto slide-up shadow-2xl">
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-3 pb-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900 leading-tight">{restaurant.name}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{visitedRecord ? "編輯用餐紀錄" : "記錄這次用餐"}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 -mt-1 -mr-1">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="px-5 pt-4 pb-6 space-y-5">
          {/* Personal rating */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">個人評分</label>
            <div className="flex items-center gap-2">
              {[1,2,3,4,5].map(i => (
                <button key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)} onClick={() => setRating(i)}>
                  <Star className={`w-8 h-8 transition-colors ${i <= (hover || rating) ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}`} />
                </button>
              ))}
              {rating > 0 && <span className="text-sm text-gray-500 ml-1">{STAR_LABELS[rating]}</span>}
            </div>
          </div>

          {/* Review */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">用餐心得</label>
            <textarea
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              placeholder="這次吃了什麼？味道如何？服務怎麼樣？"
              rows={4}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-orange-400 resize-none"
            />
          </div>

          {/* Visit date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">用餐日期</label>
            <input
              type="date"
              value={visitedAt}
              onChange={e => setVisitedAt(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className="text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-orange-400"
            />
          </div>

          {/* Cuisine type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">餐點類型</label>
            <div className="flex flex-wrap gap-2">
              {CUISINE_TYPES.filter(t => t !== "全部").map(type => (
                <button
                  key={type}
                  onClick={() => setCuisineType(type)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                    cuisineType === type ? "text-white border-transparent" : "bg-white text-gray-600 border-gray-200"
                  }`}
                  style={cuisineType === type ? { backgroundColor: "var(--brand)" } : {}}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Parking type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">停車方式</label>
            <div className="grid grid-cols-2 gap-2">
              {PARKING_TYPES.map(pt => {
                const info = PARKING_TYPE_INFO[pt];
                const active = parkingType === pt;
                return (
                  <button
                    key={pt}
                    onClick={() => setParkingType(active ? null : pt)}
                    className={`flex items-center gap-2 text-xs font-medium px-3 py-2.5 rounded-xl border transition-all text-left ${
                      active ? `${info.color} border-current` : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <span className="text-base">{info.icon}</span>
                    <span className="leading-tight">{pt}</span>
                  </button>
                );
              })}
            </div>

            {/* Parking distance (for non-onsite types) */}
            {parkingType && !["自有免費停車場","自有付費停車場","代客停車","無停車"].includes(parkingType) && (
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="number"
                  min="0"
                  max="2000"
                  value={parkingDist}
                  onChange={e => setParkingDist(e.target.value)}
                  placeholder="距離停車場約幾公尺"
                  className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-orange-400"
                />
                <span className="text-sm text-gray-500 shrink-0">公尺</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {visitedRecord && onDelete && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1.5 text-sm text-red-600 border border-red-200 px-4 py-2.5 rounded-xl hover:bg-red-50 disabled:opacity-60"
              >
                <Trash2 className="w-4 h-4" />
                {deleting ? "刪除中..." : "刪除"}
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold text-white py-2.5 rounded-xl disabled:opacity-60"
              style={{ backgroundColor: "var(--brand)" }}
            >
              <Save className="w-4 h-4" />
              {saving ? "儲存中..." : "儲存紀錄"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
