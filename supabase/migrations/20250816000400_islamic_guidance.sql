-- ============================================
-- Migration: Islamic Guidance System
-- Version: 20250816000400
-- Dependencies: 20250816000100_core_tables.sql
-- ============================================

-- Islamic guidance content table
CREATE TABLE IF NOT EXISTS public.islamic_guidance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL CHECK (content_type IN ('verse','hadith','advice')),
  title TEXT,
  content TEXT NOT NULL,
  source TEXT,
  meta JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- END OF MIGRATION: Islamic Guidance System
-- ============================================