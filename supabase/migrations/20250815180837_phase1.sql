-- Phase 1 Family OS Migration (Clean + Safe for Fresh DB or Existing Schema)

-- ============================================
-- EVENTS TABLE
-- ============================================

-- Ensure table exists
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  event_date DATE NOT NULL DEFAULT CURRENT_DATE,
  type TEXT CHECK (type IN ('birthday','anniversary','custom')) DEFAULT 'custom',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Align schema for existing installs
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='events') THEN
    ALTER TABLE public.events DROP COLUMN IF EXISTS owner_id;
    ALTER TABLE public.events DROP COLUMN IF EXISTS location;
    ALTER TABLE public.events DROP COLUMN IF EXISTS starts_at;
    ALTER TABLE public.events DROP COLUMN IF EXISTS ends_at;
    ALTER TABLE public.events DROP COLUMN IF EXISTS meta;
    ALTER TABLE public.events DROP COLUMN IF EXISTS updated_at;
    ALTER TABLE public.events ADD COLUMN IF NOT EXISTS event_date DATE NOT NULL DEFAULT CURRENT_DATE;
    ALTER TABLE public.events ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('birthday','anniversary','custom')) DEFAULT 'custom';
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Drop & recreate policies
DROP POLICY IF EXISTS "select events in my family" ON public.events;
DROP POLICY IF EXISTS "insert events as family member" ON public.events;
DROP POLICY IF EXISTS "update my events" ON public.events;
DROP POLICY IF EXISTS "delete my events" ON public.events;

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

-- ============================================
-- POSTS TABLE
-- ============================================

-- Ensure table exists
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT,
  media_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Align schema for existing installs
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='posts') THEN
    ALTER TABLE public.posts DROP COLUMN IF EXISTS body;
    ALTER TABLE public.posts DROP COLUMN IF EXISTS visibility;
    ALTER TABLE public.posts DROP COLUMN IF EXISTS audience;
    ALTER TABLE public.posts DROP COLUMN IF EXISTS updated_at;
    ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS content TEXT;
    ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS media_url TEXT;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Drop & recreate policies
DROP POLICY IF EXISTS "select posts in my family" ON public.posts;
DROP POLICY IF EXISTS "insert posts as family member" ON public.posts;
DROP POLICY IF EXISTS "update my posts" ON public.posts;
DROP POLICY IF EXISTS "delete my posts" ON public.posts;

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

-- ============================================
-- ISLAMIC GUIDANCE TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.islamic_guidance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  source TEXT,
  type TEXT CHECK (type IN ('quran','hadith','advice')) DEFAULT 'quran',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.islamic_guidance ENABLE ROW LEVEL SECURITY;

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
