-- ============================================
-- CONSOLIDATED SCHEMA WITH RLS POLICY FIX
-- Single migration file following MigrationAgent rules
-- Fixes 403 errors by implementing family-scoped security
-- ============================================

-- ============================================
-- SECTION 1: EXTENSIONS AND TYPES
-- ============================================

-- Required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom enum types
CREATE TYPE public.member_role AS ENUM ('admin', 'parent', 'child', 'member');
CREATE TYPE public.event_type AS ENUM ('birthday', 'anniversary', 'custom');

-- ============================================
-- SECTION 2: CORE TABLES
-- ============================================

-- Families table
CREATE TABLE IF NOT EXISTS public.families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Profiles table (linked to auth.users)
-- Primary key is user_id to match frontend usage
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  full_name TEXT,
  dob DATE,
  avatar_url TEXT,
  role public.member_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Helper view for current user profile
CREATE OR REPLACE VIEW public.me AS
SELECT p.* FROM public.profiles p
WHERE p.user_id = auth.uid();

-- ============================================
-- SECTION 3: EVENTS TABLES
-- ============================================

-- Events table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_type public.event_type NOT NULL DEFAULT 'custom',
  created_by UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- SECTION 4: POSTS TABLES
-- ============================================

-- Posts table for family feed
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  visibility TEXT DEFAULT 'family',
  audience JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- SECTION 5: ISLAMIC GUIDANCE TABLES
-- ============================================

-- Islamic guidance content table
CREATE TABLE IF NOT EXISTS public.islamic_guidance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('quran', 'hadith', 'advice')),
  title TEXT,
  verse_arabic TEXT,
  verse_english TEXT,
  verse_reference TEXT,
  hadith_text TEXT,
  hadith_reference TEXT,
  advice_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- SECTION 6: ADDITIONAL TABLES
-- ============================================

-- Acts of kindness tracking
CREATE TABLE IF NOT EXISTS public.acts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  act_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Feedback system
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  category TEXT,
  message TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Notes system
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  tags TEXT[],
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- SECTION 7: ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.islamic_guidance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SECTION 8: HELPER FUNCTIONS
-- ============================================

-- Centralized email whitelist function
CREATE OR REPLACE FUNCTION public.is_whitelisted_email(email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN email IN (
    'yazidgeemail@gmail.com',
    'yahyageemail@gmail.com',
    'abdessamia.mariem@gmail.com',
    'nilezat@gmail.com'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user's family ID
CREATE OR REPLACE FUNCTION public.get_user_family_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT family_id 
    FROM public.profiles 
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SECTION 9: FAMILY-SCOPED RLS POLICIES
-- ============================================

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "families_read_allowed_users" ON public.families;
DROP POLICY IF EXISTS "families_insert_allowed_users" ON public.families;
DROP POLICY IF EXISTS "families_update_allowed_users" ON public.families;
DROP POLICY IF EXISTS "families_delete_admin_only" ON public.families;

DROP POLICY IF EXISTS "profiles_read_allowed_users" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_allowed_users" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_allowed_users" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_admin_only" ON public.profiles;

DROP POLICY IF EXISTS "events_read_allowed_users" ON public.events;
DROP POLICY IF EXISTS "events_insert_allowed_users" ON public.events;
DROP POLICY IF EXISTS "events_update_allowed_users" ON public.events;
DROP POLICY IF EXISTS "events_delete_admin_only" ON public.events;

DROP POLICY IF EXISTS "posts_read_allowed_users" ON public.posts;
DROP POLICY IF EXISTS "posts_insert_allowed_users" ON public.posts;
DROP POLICY IF EXISTS "posts_update_allowed_users" ON public.posts;
DROP POLICY IF EXISTS "posts_delete_admin_only" ON public.posts;

DROP POLICY IF EXISTS "islamic_guidance_read_allowed_users" ON public.islamic_guidance;
DROP POLICY IF EXISTS "islamic_guidance_insert_allowed_users" ON public.islamic_guidance;
DROP POLICY IF EXISTS "islamic_guidance_update_allowed_users" ON public.islamic_guidance;
DROP POLICY IF EXISTS "islamic_guidance_delete_admin_only" ON public.islamic_guidance;

DROP POLICY IF EXISTS "acts_read_allowed_users" ON public.acts;
DROP POLICY IF EXISTS "acts_insert_allowed_users" ON public.acts;
DROP POLICY IF EXISTS "acts_update_allowed_users" ON public.acts;
DROP POLICY IF EXISTS "acts_delete_admin_only" ON public.acts;

DROP POLICY IF EXISTS "feedback_read_allowed_users" ON public.feedback;
DROP POLICY IF EXISTS "feedback_insert_allowed_users" ON public.feedback;
DROP POLICY IF EXISTS "feedback_update_allowed_users" ON public.feedback;
DROP POLICY IF EXISTS "feedback_delete_admin_only" ON public.feedback;

DROP POLICY IF EXISTS "notes_read_allowed_users" ON public.notes;
DROP POLICY IF EXISTS "notes_insert_allowed_users" ON public.notes;
DROP POLICY IF EXISTS "notes_update_allowed_users" ON public.notes;
DROP POLICY IF EXISTS "notes_delete_admin_only" ON public.notes;

-- Families policies (admin access + family member read)
CREATE POLICY "families_self_read" ON public.families
  FOR SELECT USING (
    public.is_whitelisted_email(auth.jwt() ->> 'email') AND
    id = public.get_user_family_id()
  );

CREATE POLICY "families_admin_insert" ON public.families
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'email' IN (
      'abdessamia.mariem@gmail.com',
      'nilezat@gmail.com'
    )
  );

CREATE POLICY "families_admin_update" ON public.families
  FOR UPDATE USING (
    auth.jwt() ->> 'email' IN (
      'abdessamia.mariem@gmail.com',
      'nilezat@gmail.com'
    )
  );

CREATE POLICY "families_admin_delete" ON public.families
  FOR DELETE USING (
    auth.jwt() ->> 'email' IN (
      'abdessamia.mariem@gmail.com',
      'nilezat@gmail.com'
    )
  );

-- Profiles policies (self access + family visibility)
CREATE POLICY "profiles_self_read" ON public.profiles
  FOR SELECT USING (
    auth.uid() = user_id OR
    (public.is_whitelisted_email(auth.jwt() ->> 'email') AND
     family_id = public.get_user_family_id())
  );

CREATE POLICY "profiles_self_insert" ON public.profiles
  FOR INSERT WITH CHECK (
    public.is_whitelisted_email(auth.jwt() ->> 'email') AND
    auth.uid() = user_id
  );

CREATE POLICY "profiles_self_update" ON public.profiles
  FOR UPDATE USING (
    auth.uid() = user_id
  );

CREATE POLICY "profiles_admin_delete" ON public.profiles
  FOR DELETE USING (
    auth.jwt() ->> 'email' IN (
      'abdessamia.mariem@gmail.com',
      'nilezat@gmail.com'
    )
  );

-- Events policies (family-scoped)
CREATE POLICY "events_family_read" ON public.events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.family_id = events.family_id
    )
  );

CREATE POLICY "events_family_insert" ON public.events
  FOR INSERT WITH CHECK (
    public.is_whitelisted_email(auth.jwt() ->> 'email') AND
    family_id = public.get_user_family_id()
  );

CREATE POLICY "events_author_update" ON public.events
  FOR UPDATE USING (
    created_by = auth.uid()
  );

CREATE POLICY "events_author_delete" ON public.events
  FOR DELETE USING (
    created_by = auth.uid() OR
    auth.jwt() ->> 'email' IN (
      'abdessamia.mariem@gmail.com',
      'nilezat@gmail.com'
    )
  );

-- Posts policies (family-scoped)
CREATE POLICY "posts_family_read" ON public.posts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.family_id = posts.family_id
    )
  );

CREATE POLICY "posts_family_insert" ON public.posts
  FOR INSERT WITH CHECK (
    public.is_whitelisted_email(auth.jwt() ->> 'email') AND
    family_id = public.get_user_family_id() AND
    author_id = auth.uid()
  );

CREATE POLICY "posts_author_update" ON public.posts
  FOR UPDATE USING (
    author_id = auth.uid()
  );

CREATE POLICY "posts_author_delete" ON public.posts
  FOR DELETE USING (
    author_id = auth.uid() OR
    auth.jwt() ->> 'email' IN (
      'abdessamia.mariem@gmail.com',
      'nilezat@gmail.com'
    )
  );

-- Islamic guidance policies (family-scoped)
CREATE POLICY "islamic_guidance_family_read" ON public.islamic_guidance
  FOR SELECT USING (
    family_id IS NULL OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.family_id = islamic_guidance.family_id
    )
  );

CREATE POLICY "islamic_guidance_family_insert" ON public.islamic_guidance
  FOR INSERT WITH CHECK (
    public.is_whitelisted_email(auth.jwt() ->> 'email') AND
    (family_id IS NULL OR family_id = public.get_user_family_id())
  );

CREATE POLICY "islamic_guidance_admin_update" ON public.islamic_guidance
  FOR UPDATE USING (
    auth.jwt() ->> 'email' IN (
      'abdessamia.mariem@gmail.com',
      'nilezat@gmail.com'
    )
  );

CREATE POLICY "islamic_guidance_admin_delete" ON public.islamic_guidance
  FOR DELETE USING (
    auth.jwt() ->> 'email' IN (
      'abdessamia.mariem@gmail.com',
      'nilezat@gmail.com'
    )
  );

-- Acts policies (family-scoped)
CREATE POLICY "acts_family_read" ON public.acts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.family_id = acts.family_id
    )
  );

CREATE POLICY "acts_family_insert" ON public.acts
  FOR INSERT WITH CHECK (
    public.is_whitelisted_email(auth.jwt() ->> 'email') AND
    family_id = public.get_user_family_id() AND
    actor_id = auth.uid()
  );

CREATE POLICY "acts_author_update" ON public.acts
  FOR UPDATE USING (
    actor_id = auth.uid()
  );

CREATE POLICY "acts_author_delete" ON public.acts
  FOR DELETE USING (
    actor_id = auth.uid() OR
    auth.jwt() ->> 'email' IN (
      'abdessamia.mariem@gmail.com',
      'nilezat@gmail.com'
    )
  );

-- Feedback policies (family-scoped)
CREATE POLICY "feedback_family_read" ON public.feedback
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.family_id = feedback.family_id
    )
  );

CREATE POLICY "feedback_family_insert" ON public.feedback
  FOR INSERT WITH CHECK (
    public.is_whitelisted_email(auth.jwt() ->> 'email') AND
    family_id = public.get_user_family_id() AND
    author_id = auth.uid()
  );

CREATE POLICY "feedback_author_update" ON public.feedback
  FOR UPDATE USING (
    author_id = auth.uid()
  );

CREATE POLICY "feedback_author_delete" ON public.feedback
  FOR DELETE USING (
    author_id = auth.uid() OR
    auth.jwt() ->> 'email' IN (
      'abdessamia.mariem@gmail.com',
      'nilezat@gmail.com'
    )
  );

-- Notes policies (family-scoped with privacy)
CREATE POLICY "notes_family_read" ON public.notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.family_id = notes.family_id
    ) AND (
      is_private = false OR author_id = auth.uid()
    )
  );

CREATE POLICY "notes_family_insert" ON public.notes
  FOR INSERT WITH CHECK (
    public.is_whitelisted_email(auth.jwt() ->> 'email') AND
    family_id = public.get_user_family_id() AND
    author_id = auth.uid()
  );

CREATE POLICY "notes_author_update" ON public.notes
  FOR UPDATE USING (
    author_id = auth.uid()
  );

CREATE POLICY "notes_author_delete" ON public.notes
  FOR DELETE USING (
    author_id = auth.uid() OR
    auth.jwt() ->> 'email' IN (
      'abdessamia.mariem@gmail.com',
      'nilezat@gmail.com'
    )
  );

-- ============================================
-- SECTION 10: PERFORMANCE INDEXES
-- ============================================

-- Core table indexes
CREATE INDEX IF NOT EXISTS idx_profiles_family_id ON public.profiles(family_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_events_family_id ON public.events(family_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_posts_family_id ON public.posts(family_id);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_islamic_guidance_family_id ON public.islamic_guidance(family_id);
CREATE INDEX IF NOT EXISTS idx_acts_family_id ON public.acts(family_id);
CREATE INDEX IF NOT EXISTS idx_acts_actor_id ON public.acts(actor_id);
CREATE INDEX IF NOT EXISTS idx_feedback_family_id ON public.feedback(family_id);
CREATE INDEX IF NOT EXISTS idx_notes_family_id ON public.notes(family_id);
CREATE INDEX IF NOT EXISTS idx_notes_author_id ON public.notes(author_id);

-- ============================================
-- END OF CONSOLIDATED MIGRATION
-- ============================================