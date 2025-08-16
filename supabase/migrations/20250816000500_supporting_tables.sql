-- ============================================
-- Migration: Supporting Tables (Acts, Feedback, Notes)
-- Version: 20250816000500
-- Dependencies: 20250816000100_core_tables.sql
-- ============================================

-- Acts of kindness tracking
CREATE TABLE IF NOT EXISTS public.acts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  description TEXT,
  points INTEGER DEFAULT 1,
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Feedback and suggestions
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  feedback_type TEXT CHECK (feedback_type IN ('bug','feature','improvement','praise')) DEFAULT 'improvement',
  title TEXT NOT NULL,
  description TEXT,
  priority INTEGER DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  status TEXT DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','closed')),
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Personal notes (private to user)
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  tags JSONB DEFAULT '[]',
  is_pinned BOOLEAN DEFAULT false,
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- END OF MIGRATION: Supporting Tables (Acts, Feedback, Notes)
-- ============================================