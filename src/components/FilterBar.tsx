"use client";

import { PRICE_LEVEL_INFO, type CuisineType, type SearchFilters, type SortBy } from "@/types";
import { Search, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { useState } from "react";

// Food categories go into the dropdown
const FOOD_CUISINES: CuisineType[] = [
  "全部", "台式", "中式", "日式", "韓式",
  "義式", "美式", "東南亞", "火鍋", "燒烤",
  "早午餐", "甜點咖啡", "海鮮", "素食", "其他",
];

// Special categories get dedicated quick-access buttons
const SPECIAL_CUISINES: { type: CuisineType; icon: string; short: string }[] = [
  { type: "百貨美食街", icon: "🏬", short: "百貨" },
  { type: "親子樂園",   icon: "🎠", short: "親子" },
  { type: "連鎖藥局",   icon: "💊", short: "藥局" },
];

interface FilterBarProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  onSearch: () => void;
  loading: boolean;
}

const RADIUS_OPTIONS = [
  { label: "500m", value: 500 },
  { label: "1km",  value: 1000 },
  { label: "2km",  value: 2000 },
  { label: "5km",  value: 5000 },
];

const RATING_OPTIONS = [
  { label: "全部", value: 0 },
  { label: "4.0+", value: 4.0 },
  { label: "4.5+", value: 4.5 },
];

const SORT_OPTIONS: { label: string; value: SortBy }[] = [
  { label: "熱門優先", value: "POPULARITY" },
  { label: "評分優先", value: "RATING" },
  { label: "距離優先", value: "DISTANCE" },
];

const PRICE_OPTIONS = [
  { label: "不限",      value: 0 },
  { label: "$150以下",  value: 1 },
  { label: "$150–400",  value: 2 },
  { label: "$400–800",  value: 3 },
  { label: "$800以上",  value: 4 },
];

function Chip({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 text-xs px-3 py-1.5 rounded-lg border transition-all font-medium ${
        active ? "text-white border-transparent" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
      }`}
      style={active ? { backgroundColor: "var(--brand)", borderColor: "var(--brand)" } : {}}
    >
      {children}
    </button>
  );
}

// Count active advanced filters (not including defaults)
function countActiveAdvanced(f: SearchFilters) {
  let n = 0;
  if (f.openNow)          n++;
  if (f.maxPriceLevel > 0) n++;
  if (f.requireParking)   n++;
  if (f.sortBy !== "POPULARITY") n++;
  if (f.searchRadius !== 2000)   n++;
  if (f.minRating !== 4.0)       n++;
  return n;
}

export default function FilterBar({ filters, onChange, onSearch, loading }: FilterBarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const set = (p: Partial<SearchFilters>) => onChange({ ...filters, ...p });
  const advCount = countActiveAdvanced(filters);

  return (
    <div className="bg-white shadow-md z-10">
      {/* Search row */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="搜尋餐廳名稱..."
            value={filters.keyword}
            onChange={e => set({ keyword: e.target.value })}
            onKeyDown={e => e.key === "Enter" && onSearch()}
            className="flex-1 bg-transparent text-sm outline-none"
          />
          {filters.keyword && (
            <button onClick={() => set({ keyword: "" })}>
              <X className="w-3.5 h-3.5 text-gray-400" />
            </button>
          )}
        </div>
        <button
          onClick={onSearch}
          disabled={loading}
          className="text-white text-sm font-semibold px-4 py-2 rounded-xl disabled:opacity-60 transition-colors shrink-0"
          style={{ backgroundColor: "var(--brand)" }}
        >
          {loading ? "搜尋中" : "搜尋"}
        </button>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`relative p-2 rounded-xl transition-colors border ${
            showAdvanced ? "border-transparent text-white" : "border-gray-200 text-gray-500 bg-white"
          }`}
          style={showAdvanced ? { backgroundColor: "var(--brand)" } : {}}
        >
          <SlidersHorizontal className="w-4 h-4" />
          {advCount > 0 && !showAdvanced && (
            <span className="absolute -top-1 -right-1 w-4 h-4 text-xs bg-red-500 text-white rounded-full flex items-center justify-center font-bold">
              {advCount}
            </span>
          )}
        </button>
      </div>

      {/* Cuisine row: dropdown + special quick buttons */}
      <div className="flex items-center gap-2 px-3 pb-2">
        {/* Food category dropdown */}
        <div className="relative flex-1">
          <select
            value={FOOD_CUISINES.includes(filters.cuisineType) ? filters.cuisineType : "全部"}
            onChange={e => set({ cuisineType: e.target.value as CuisineType })}
            className="w-full appearance-none text-xs font-medium pl-3 pr-7 py-1.5 rounded-xl border transition-all outline-none cursor-pointer"
            style={
              FOOD_CUISINES.includes(filters.cuisineType) && filters.cuisineType !== "全部"
                ? { backgroundColor: "var(--brand)", color: "#fff", borderColor: "var(--brand)" }
                : { backgroundColor: "#fff", color: "#374151", borderColor: "#e5e7eb" }
            }
          >
            {FOOD_CUISINES.map(type => (
              <option key={type} value={type}>{type === "全部" ? "🍽️ 美食類型" : type}</option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
            style={
              FOOD_CUISINES.includes(filters.cuisineType) && filters.cuisineType !== "全部"
                ? { color: "#fff" }
                : { color: "#9ca3af" }
            }
          />
        </div>

        {/* Special category quick buttons */}
        {SPECIAL_CUISINES.map(({ type, icon, short }) => {
          const active = filters.cuisineType === type;
          return (
            <button
              key={type}
              onClick={() => set({ cuisineType: active ? "全部" : type })}
              className="shrink-0 flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl border transition-all"
              style={
                active
                  ? { backgroundColor: "var(--brand)", color: "#fff", borderColor: "var(--brand)" }
                  : { backgroundColor: "#fff", color: "#374151", borderColor: "#e5e7eb" }
              }
              title={type}
            >
              <span>{icon}</span>
              <span>{short}</span>
            </button>
          );
        })}
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="border-t border-gray-100 px-3 py-3 space-y-3 bg-gray-50">

          {/* Row 1: Open now + Require parking */}
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => set({ openNow: !filters.openNow })}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border transition-all ${
                filters.openNow
                  ? "text-white border-transparent"
                  : "bg-white text-gray-600 border-gray-200"
              }`}
              style={filters.openNow ? { backgroundColor: "#16a34a" } : {}}
            >
              <span className={`w-2 h-2 rounded-full ${filters.openNow ? "bg-white" : "bg-green-500"}`} />
              現在營業中
            </button>
            <button
              onClick={() => set({ requireParking: !filters.requireParking })}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border transition-all ${
                filters.requireParking
                  ? "text-white border-transparent"
                  : "bg-white text-gray-600 border-gray-200"
              }`}
              style={filters.requireParking ? { backgroundColor: "var(--brand)" } : {}}
            >
              🅿️ 有停車場
            </button>
          </div>

          {/* Row 2: Price */}
          <div>
            <p className="text-xs text-gray-500 font-semibold mb-1.5">價位範圍（每人）</p>
            <div className="flex gap-1.5 flex-wrap">
              {PRICE_OPTIONS.map(opt => (
                <Chip key={opt.value} active={filters.maxPriceLevel === opt.value} onClick={() => set({ maxPriceLevel: opt.value })}>
                  {opt.label}
                </Chip>
              ))}
            </div>
          </div>

          {/* Row 3: Min rating */}
          <div>
            <p className="text-xs text-gray-500 font-semibold mb-1.5">最低評分</p>
            <div className="flex gap-1.5">
              {RATING_OPTIONS.map(opt => (
                <Chip key={opt.value} active={filters.minRating === opt.value} onClick={() => set({ minRating: opt.value })}>
                  {opt.label}
                </Chip>
              ))}
            </div>
          </div>

          {/* Row 4: Radius */}
          <div>
            <p className="text-xs text-gray-500 font-semibold mb-1.5">搜尋半徑</p>
            <div className="flex gap-1.5">
              {RADIUS_OPTIONS.map(opt => (
                <Chip key={opt.value} active={filters.searchRadius === opt.value} onClick={() => set({ searchRadius: opt.value })}>
                  {opt.label}
                </Chip>
              ))}
            </div>
          </div>

          {/* Row 5: Sort */}
          <div>
            <p className="text-xs text-gray-500 font-semibold mb-1.5">排序方式</p>
            <div className="flex gap-1.5">
              {SORT_OPTIONS.map(opt => (
                <Chip key={opt.value} active={filters.sortBy === opt.value} onClick={() => set({ sortBy: opt.value })}>
                  {opt.label}
                </Chip>
              ))}
            </div>
          </div>

          {/* Reset */}
          {advCount > 0 && (
            <button
              onClick={() => onChange({ ...filters, openNow: false, maxPriceLevel: 0, requireParking: false, sortBy: "POPULARITY", searchRadius: 2000, minRating: 4.0 })}
              className="text-xs text-gray-500 underline"
            >
              重設篩選條件
            </button>
          )}
        </div>
      )}
    </div>
  );
}
