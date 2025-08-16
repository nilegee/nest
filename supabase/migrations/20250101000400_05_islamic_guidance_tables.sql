-- ============================================
-- Migration 05: Islamic Guidance Tables
-- Creates Islamic guidance system (removable feature)
-- ============================================

-- Islamic guidance table (removable but used in current code)
CREATE TABLE IF NOT EXISTS public.islamic_guidance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  verse_arabic TEXT,
  verse_english TEXT,
  verse_reference TEXT,
  hadith_text TEXT,
  hadith_reference TEXT,
  advice_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on Islamic guidance table
ALTER TABLE public.islamic_guidance ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ROLLBACK
-- ============================================
-- To rollback this migration:
-- DROP TABLE IF EXISTS public.islamic_guidance;