-- ============================================
-- Migration 06: Additional Tables (Acts, Feedback, Notes)
-- Creates supporting tables for family activities and interactions
-- ============================================

-- Additional tables from schema verification (acts, feedback, notes)
CREATE TABLE IF NOT EXISTS public.acts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  points INTEGER DEFAULT 1,
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  about_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  by_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  answers JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  body TEXT,
  checklist JSONB,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on additional tables
ALTER TABLE public.acts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ROLLBACK
-- ============================================
-- To rollback this migration:
-- DROP TABLE IF EXISTS public.notes;
-- DROP TABLE IF EXISTS public.feedback;
-- DROP TABLE IF EXISTS public.acts;