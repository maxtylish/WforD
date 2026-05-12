-- =====================================================
-- 下一餐吃什麼 — Supabase Database Schema
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── visited_places table ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.visited_places (
  id                       UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id                 TEXT         NOT NULL UNIQUE,   -- Google Place ID
  name                     TEXT         NOT NULL,
  address                  TEXT,
  cuisine_type             TEXT         NOT NULL DEFAULT '其他',
  google_rating            NUMERIC(2,1) NOT NULL DEFAULT 0,
  has_parking              BOOLEAN      NOT NULL DEFAULT false,
  parking_type             TEXT,        -- 自有免費停車場/自有付費停車場/代客停車/附近工友車位/附近公有停車場/附近路邊停車/無停車
  parking_distance_meters  INTEGER,
  lat                      NUMERIC(10, 8) NOT NULL,
  lng                      NUMERIC(11, 8) NOT NULL,
  visited_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  personal_rating          SMALLINT     CHECK (personal_rating BETWEEN 1 AND 5),
  review_text              TEXT,
  photo_url                TEXT,
  created_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_visited_places_visited_at
  ON public.visited_places (visited_at DESC);

CREATE INDEX IF NOT EXISTS idx_visited_places_cuisine_type
  ON public.visited_places (cuisine_type);

-- ── Row Level Security (personal use — allow all) ─────────────────────────
ALTER TABLE public.visited_places ENABLE ROW LEVEL SECURITY;

-- Policy: allow all operations (no auth required — personal app)
CREATE POLICY "Allow all for personal use"
  ON public.visited_places
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ── Auto-update updated_at trigger ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_visited_places_update
  BEFORE UPDATE ON public.visited_places
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── Migration: add parking_type column (run if table already exists) ─────
-- ALTER TABLE public.visited_places ADD COLUMN IF NOT EXISTS parking_type TEXT;

-- ── favorites table ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.favorites (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id      TEXT         NOT NULL UNIQUE,
  name          TEXT         NOT NULL,
  address       TEXT         DEFAULT '',
  cuisine_type  TEXT         DEFAULT '其他',
  google_rating NUMERIC(2,1) DEFAULT 0,
  lat           NUMERIC(10,8) NOT NULL DEFAULT 0,
  lng           NUMERIC(11,8) NOT NULL DEFAULT 0,
  photo_url     TEXT,
  price_level   SMALLINT,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_favorites_created_at
  ON public.favorites (created_at DESC);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for favorites"
  ON public.favorites
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ── Sample data (optional, remove if not needed) ──────────────────────────
-- INSERT INTO public.visited_places (place_id, name, address, cuisine_type, google_rating, has_parking, lat, lng, personal_rating, review_text)
-- VALUES
--   ('sample_001', '範例餐廳', '台中市西屯區示範路1號', '台式', 4.2, true, 24.1477, 120.6736, 5, '很好吃！');
