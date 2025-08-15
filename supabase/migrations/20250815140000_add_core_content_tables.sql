-- 20250815140000_add_core_content_tables.sql
-- Add missing core content tables that the application expects

-- Create core content tables that are missing from previous migrations
-- These should be created after families and profiles

-- Events table
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  title text NOT NULL,
  location text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  meta jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Posts table
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  body text NOT NULL,
  visibility text NOT NULL DEFAULT 'family', -- 'private' | 'family' | 'custom'
  audience jsonb,                            -- ids when custom
  created_at timestamptz DEFAULT now()
);

-- Acts table (activity log)
CREATE TABLE IF NOT EXISTS public.acts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  kind text NOT NULL,      -- 'gentle_action' | 'kindness' | 'goal_contrib' | ...
  points int DEFAULT 1,
  meta jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Notes table
CREATE TABLE IF NOT EXISTS public.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  body text,
  checklist jsonb,            -- [{text, done}]
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for family-scoped reading
CREATE POLICY "events: read family scope"
ON public.events FOR SELECT
USING (family_id = (SELECT family_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "posts: read family scope"
ON public.posts FOR SELECT
USING (family_id = (SELECT family_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "acts: read family scope"
ON public.acts FOR SELECT
USING (family_id = (SELECT family_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "notes: read family scope"
ON public.notes FOR SELECT
USING (family_id = (SELECT family_id FROM public.profiles WHERE user_id = auth.uid()));

-- Write policies for owners
CREATE POLICY "events: owner write"
ON public.events FOR ALL
USING (owner_id = auth.uid());

CREATE POLICY "posts: author write"
ON public.posts FOR ALL
USING (author_id = auth.uid());

CREATE POLICY "acts: user write"
ON public.acts FOR ALL
USING (user_id = auth.uid());

CREATE POLICY "notes: author write"
ON public.notes FOR ALL
USING (author_id = auth.uid());

-- Admin policies
CREATE POLICY "events: admin manage"
ON public.events FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles ap
    WHERE ap.user_id = auth.uid()
      AND ap.family_id = events.family_id
      AND ap.role = 'admin'
  )
);

CREATE POLICY "notes: admin manage"
ON public.notes FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles ap
    WHERE ap.user_id = auth.uid()
      AND ap.family_id = notes.family_id
      AND ap.role = 'admin'
  )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS events_family_idx ON public.events(family_id);
CREATE INDEX IF NOT EXISTS events_starts_at_idx ON public.events(starts_at);
CREATE INDEX IF NOT EXISTS posts_family_idx ON public.posts(family_id);
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON public.posts(created_at);
CREATE INDEX IF NOT EXISTS acts_family_user_idx ON public.acts(family_id, user_id);
CREATE INDEX IF NOT EXISTS acts_kind_idx ON public.acts(kind);
CREATE INDEX IF NOT EXISTS notes_family_idx ON public.notes(family_id);