-- ============================================
-- Migration 04: Posts Tables
-- Creates posts system for family feed functionality
-- ============================================

-- Posts table  
-- Uses 'content' and 'media_url' columns as used in feed-view.js
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  visibility TEXT DEFAULT 'family',
  audience JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on posts table
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ROLLBACK
-- ============================================
-- To rollback this migration:
-- DROP TABLE IF EXISTS public.posts;