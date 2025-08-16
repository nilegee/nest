-- ============================================
-- Migration: Posts and Feed System
-- Version: 20250816000300
-- Dependencies: 20250816000100_core_tables.sql
-- ============================================

-- Posts table for family wall/feed
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_url TEXT,
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- END OF MIGRATION: Posts and Feed System
-- ============================================