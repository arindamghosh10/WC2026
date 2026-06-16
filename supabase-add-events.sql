-- ============================================================
-- Add match events columns to matches table
-- Run this in Supabase SQL Editor
-- ============================================================

ALTER TABLE matches ADD COLUMN IF NOT EXISTS goals        jsonb DEFAULT '[]';
ALTER TABLE matches ADD COLUMN IF NOT EXISTS bookings     jsonb DEFAULT '[]';
ALTER TABLE matches ADD COLUMN IF NOT EXISTS substitutions jsonb DEFAULT '[]';
