import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { VisitedPlace } from "@/types";

// GET /api/visited — fetch all visited places
export async function GET() {
  const { data, error } = await supabase
    .from("visited_places")
    .select("*")
    .order("visited_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ visited: data ?? [] });
}

// POST /api/visited — add or update a visited place (upsert by place_id)
export async function POST(req: NextRequest) {
  const body: Omit<VisitedPlace, "id" | "created_at" | "updated_at"> =
    await req.json();

  const { data, error } = await supabase
    .from("visited_places")
    .upsert(
      { ...body, updated_at: new Date().toISOString() },
      { onConflict: "place_id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ visited: data }, { status: 201 });
}
