-- Phase 1 Family OS Migration
-- This migration creates/modifies tables for Phase 1 functionality

-- Events table (modify existing to match Phase 1 requirements)
-- Note: events table already exists but needs to be aligned with Phase 1 schema
ALTER TABLE IF EXISTS public.events 
  DROP COLUMN IF EXISTS owner_id,
  DROP COLUMN IF EXISTS location,
  DROP COLUMN IF EXISTS starts_at,
  DROP COLUMN IF EXISTS ends_at,
  DROP COLUMN IF EXISTS meta,
  DROP COLUMN IF EXISTS updated_at;

ALTER TABLE public.events 
  ADD COLUMN IF NOT EXISTS event_date DATE NOT NULL DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('birthday','anniversary','custom')) DEFAULT 'custom';

-- If events table doesn't exist, create it
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  event_date DATE NOT NULL,
  type TEXT CHECK (type IN ('birthday','anniversary','custom')) DEFAULT 'custom',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on events table
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate with Phase 1 requirements
DROP POLICY IF EXISTS "select events in my family" ON public.events;
DROP POLICY IF EXISTS "insert events as family member" ON public.events;
DROP POLICY IF EXISTS "update my events" ON public.events;
DROP POLICY IF EXISTS "delete my events" ON public.events;

-- Create Phase 1 RLS policies for events
CREATE POLICY "events family read" ON public.events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.family_id = events.family_id
    )
  );

CREATE POLICY "events family insert" ON public.events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.family_id = events.family_id
    )
  );

-- Posts table (modify existing to match Phase 1 requirements)
-- Note: posts table already exists but needs to be aligned with Phase 1 schema
ALTER TABLE IF EXISTS public.posts 
  DROP COLUMN IF EXISTS body,
  DROP COLUMN IF EXISTS visibility,
  DROP COLUMN IF EXISTS audience,
  DROP COLUMN IF EXISTS updated_at;

ALTER TABLE public.posts 
  ADD COLUMN IF NOT EXISTS content TEXT,
  ADD COLUMN IF NOT EXISTS media_url TEXT;

-- If posts table doesn't exist, create it
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT,
  media_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on posts table
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate with Phase 1 requirements
DROP POLICY IF EXISTS "select posts in my family" ON public.posts;
DROP POLICY IF EXISTS "insert posts as family member" ON public.posts;
DROP POLICY IF EXISTS "update my posts" ON public.posts;
DROP POLICY IF EXISTS "delete my posts" ON public.posts;

-- Create Phase 1 RLS policies for posts
CREATE POLICY "posts family read" ON public.posts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.family_id = posts.family_id
    )
  );

CREATE POLICY "posts family insert" ON public.posts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.family_id = posts.family_id
    )
  );

-- Islamic guidance table (new table for Phase 1)
CREATE TABLE IF NOT EXISTS public.islamic_guidance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  source TEXT,
  type TEXT CHECK (type IN ('quran','hadith','advice')) DEFAULT 'quran',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on islamic_guidance table
ALTER TABLE public.islamic_guidance ENABLE ROW LEVEL SECURITY;

-- Create Phase 1 RLS policies for islamic_guidance
CREATE POLICY "guidance family read" ON public.islamic_guidance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.family_id = islamic_guidance.family_id
    )
  );

CREATE POLICY "guidance family insert" ON public.islamic_guidance
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.family_id = islamic_guidance.family_id
    )
  );