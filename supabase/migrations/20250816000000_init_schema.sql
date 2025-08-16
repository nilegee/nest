-- ============================================
-- Single Migration File: Complete Nest Schema
-- Following MigrationAgent SINGLE MIGRATION FILE POLICY
-- Consolidates all schema definitions, RLS policies, and indexes
-- ============================================

-- ============================================
-- SECTION 1: Extensions and Custom Types
-- ============================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Custom types
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'member_role') THEN
    CREATE TYPE public.member_role AS ENUM ('admin','member');
  END IF;
END $$;

-- ============================================
-- SECTION 2: Core Tables (Families and Profiles)
-- ============================================

-- Families table
CREATE TABLE IF NOT EXISTS public.families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Profiles table (linked to auth.users)
-- Primary key is user_id to match code usage
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  full_name TEXT,
  dob DATE,
  avatar_url TEXT,
  role public.member_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Helper view (referenced in verify-schema.sql)
CREATE OR REPLACE VIEW public.me AS
SELECT p.* FROM public.profiles p
WHERE p.user_id = auth.uid();

-- ============================================
-- SECTION 3: Events Tables
-- ============================================

-- Events table
-- Matches exact structure from events-view.js usage
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  event_date DATE NOT NULL DEFAULT CURRENT_DATE,
  type TEXT CHECK (type IN ('birthday','anniversary','custom')) DEFAULT 'custom',
  location TEXT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  description TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern JSONB,
  notification_settings JSONB DEFAULT '{"email": true, "push": false}',
  attendees JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- SECTION 4: Posts Tables
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
-- SECTION 5: Islamic Guidance Tables
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
-- SECTION 6: Additional Tables
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
-- SECTION 7: Enable RLS on All Tables
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
-- SECTION 8: RLS Policies
-- ============================================

-- Helper function for whitelisted emails (centralized approach)
CREATE OR REPLACE FUNCTION public.is_whitelisted_email(email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- This should be updated to read from environment or configuration table
  -- For now, maintaining the current whitelist for compatibility
  RETURN email IN (
    'yazidgeemail@gmail.com',
    'yahyageemail@gmail.com',
    'abdessamia.mariem@gmail.com',
    'nilezat@gmail.com'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Families policies
CREATE POLICY "families_read_allowed_users" ON public.families
  FOR SELECT USING (public.is_whitelisted_email(auth.jwt() ->> 'email'));

CREATE POLICY "families_insert_allowed_users" ON public.families
  FOR INSERT WITH CHECK (public.is_whitelisted_email(auth.jwt() ->> 'email'));

CREATE POLICY "families_update_allowed_users" ON public.families
  FOR UPDATE USING (public.is_whitelisted_email(auth.jwt() ->> 'email'));

CREATE POLICY "families_delete_admin_only" ON public.families
  FOR DELETE USING (
    auth.jwt() ->> 'email' IN (
      'abdessamia.mariem@gmail.com',
      'nilezat@gmail.com'
    )
  );

-- Profiles policies
CREATE POLICY "profiles_read_allowed_users" ON public.profiles
  FOR SELECT USING (public.is_whitelisted_email(auth.jwt() ->> 'email'));

CREATE POLICY "profiles_insert_allowed_users" ON public.profiles
  FOR INSERT WITH CHECK (public.is_whitelisted_email(auth.jwt() ->> 'email'));

CREATE POLICY "profiles_update_allowed_users" ON public.profiles
  FOR UPDATE USING (public.is_whitelisted_email(auth.jwt() ->> 'email'));

CREATE POLICY "profiles_delete_admin_only" ON public.profiles
  FOR DELETE USING (
    auth.jwt() ->> 'email' IN (
      'abdessamia.mariem@gmail.com',
      'nilezat@gmail.com'
    )
  );

-- Events policies
CREATE POLICY "events_family_read" ON public.events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.family_id = events.family_id
    )
  );

CREATE POLICY "events_family_insert" ON public.events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.family_id = events.family_id
    )
  );

CREATE POLICY "events_family_update" ON public.events
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.family_id = events.family_id
    )
  );

CREATE POLICY "events_family_delete" ON public.events
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.family_id = events.family_id
    )
  );

-- Posts policies
CREATE POLICY "posts_family_read" ON public.posts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.family_id = posts.family_id
    )
  );

CREATE POLICY "posts_family_insert" ON public.posts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.family_id = posts.family_id
    )
  );

CREATE POLICY "posts_author_update" ON public.posts
  FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "posts_author_delete" ON public.posts
  FOR DELETE USING (author_id = auth.uid());

-- Islamic guidance policies
CREATE POLICY "islamic_guidance_read_all" ON public.islamic_guidance
  FOR SELECT USING (public.is_whitelisted_email(auth.jwt() ->> 'email'));

CREATE POLICY "islamic_guidance_admin_modify" ON public.islamic_guidance
  FOR ALL USING (
    auth.jwt() ->> 'email' IN (
      'abdessamia.mariem@gmail.com',
      'nilezat@gmail.com'
    )
  );

-- Acts policies
CREATE POLICY "acts_family_read" ON public.acts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.family_id = acts.family_id
    )
  );

CREATE POLICY "acts_family_insert" ON public.acts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.family_id = acts.family_id
    )
  );

CREATE POLICY "acts_family_update" ON public.acts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.family_id = acts.family_id
    )
  );

CREATE POLICY "acts_family_delete" ON public.acts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.family_id = acts.family_id
    )
  );

-- Feedback policies
CREATE POLICY "feedback_family_read" ON public.feedback
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.family_id = feedback.family_id
    )
  );

CREATE POLICY "feedback_family_insert" ON public.feedback
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.family_id = feedback.family_id
    )
  );

CREATE POLICY "feedback_author_update" ON public.feedback
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "feedback_author_delete" ON public.feedback
  FOR DELETE USING (user_id = auth.uid());

-- Notes policies (private to user)
CREATE POLICY "notes_user_read" ON public.notes
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notes_user_insert" ON public.notes
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "notes_user_update" ON public.notes
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "notes_user_delete" ON public.notes
  FOR DELETE USING (user_id = auth.uid());

-- ============================================
-- SECTION 9: Performance Indexes
-- ============================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_family_id ON public.profiles(family_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- Events indexes
CREATE INDEX IF NOT EXISTS idx_events_family_id ON public.events(family_id);
CREATE INDEX IF NOT EXISTS idx_events_owner_id ON public.events(owner_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_type ON public.events(type);

-- Posts indexes
CREATE INDEX IF NOT EXISTS idx_posts_family_id ON public.posts(family_id);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);

-- Islamic guidance indexes
CREATE INDEX IF NOT EXISTS idx_islamic_guidance_content_type ON public.islamic_guidance(content_type);
CREATE INDEX IF NOT EXISTS idx_islamic_guidance_active ON public.islamic_guidance(is_active);

-- Acts indexes
CREATE INDEX IF NOT EXISTS idx_acts_family_id ON public.acts(family_id);
CREATE INDEX IF NOT EXISTS idx_acts_actor_id ON public.acts(actor_id);
CREATE INDEX IF NOT EXISTS idx_acts_recipient_id ON public.acts(recipient_id);
CREATE INDEX IF NOT EXISTS idx_acts_created_at ON public.acts(created_at DESC);

-- Feedback indexes
CREATE INDEX IF NOT EXISTS idx_feedback_family_id ON public.feedback(family_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback(status);

-- Notes indexes
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON public.notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_pinned ON public.notes(is_pinned);

-- ============================================
-- END OF MIGRATION
-- ============================================