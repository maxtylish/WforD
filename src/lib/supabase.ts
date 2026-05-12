import { createClient } from "@supabase/supabase-js";
import type { VisitedPlace, FavoritePlace, CuisineType } from "@/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = () =>
  Boolean(supabaseUrl && supabaseKey);

// Only create client when credentials are available
export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseKey)
  : null as unknown as ReturnType<typeof createClient>;

// ── Visited Places API ──────────────────────────────────────────────────────

export async function getVisitedPlaces(): Promise<VisitedPlace[]> {
  const { data, error } = await supabase
    .from("visited_places")
    .select("*")
    .order("visited_at", { ascending: false });

  if (error) {
    console.error("[Supabase] getVisitedPlaces:", error.message);
    return [];
  }
  return data ?? [];
}

export async function upsertVisitedPlace(
  payload: Omit<VisitedPlace, "id" | "created_at" | "updated_at">
): Promise<VisitedPlace | null> {
  const { data, error } = await supabase
    .from("visited_places")
    .upsert(
      { ...payload, updated_at: new Date().toISOString() },
      { onConflict: "place_id" }
    )
    .select()
    .single();

  if (error) {
    console.error("[Supabase] upsertVisitedPlace:", error.message);
    return null;
  }
  return data;
}

export async function updateVisitedPlace(
  id: string,
  payload: Partial<
    Pick<
      VisitedPlace,
      | "personal_rating"
      | "review_text"
      | "has_parking"
      | "parking_distance_meters"
      | "visited_at"
      | "cuisine_type"
    >
  >
): Promise<VisitedPlace | null> {
  const { data, error } = await supabase
    .from("visited_places")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[Supabase] updateVisitedPlace:", error.message);
    return null;
  }
  return data;
}

export async function deleteVisitedPlace(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("visited_places")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[Supabase] deleteVisitedPlace:", error.message);
    return false;
  }
  return true;
}

// ── Favorites API ───────────────────────────────────────────────────────────

export async function getFavorites(): Promise<FavoritePlace[]> {
  const { data, error } = await supabase
    .from("favorites")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) { console.error("[Supabase] getFavorites:", error.message); return []; }
  return data ?? [];
}

export async function addFavorite(
  payload: Omit<FavoritePlace, "id" | "created_at">
): Promise<FavoritePlace | null> {
  const { data, error } = await supabase
    .from("favorites")
    .upsert(payload, { onConflict: "place_id" })
    .select()
    .single();
  if (error) { console.error("[Supabase] addFavorite:", error.message); return null; }
  return data;
}

export async function removeFavorite(place_id: string): Promise<boolean> {
  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("place_id", place_id);
  if (error) { console.error("[Supabase] removeFavorite:", error.message); return false; }
  return true;
}

// ── LocalStorage fallback (when Supabase is not configured) ─────────────────

const LS_KEY = "next_meal_visited";

const LS_FAV_KEY = "next_meal_favorites";

export function lsGetFavorites(): FavoritePlace[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(LS_FAV_KEY) ?? "[]"); } catch { return []; }
}

export function lsSaveFavorites(places: FavoritePlace[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_FAV_KEY, JSON.stringify(places));
}

export function lsGetVisited(): VisitedPlace[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function lsSaveVisited(places: VisitedPlace[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_KEY, JSON.stringify(places));
}
