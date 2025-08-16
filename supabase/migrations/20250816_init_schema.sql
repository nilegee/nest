-- ============================================
-- Complete Schema Initialization for Nest Family App
-- Single migration file containing all required tables and RLS
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
-- CORE TABLES
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
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add new fields for enhanced events system
DO $$
BEGIN
  -- Add category field if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'category') THEN
    ALTER TABLE public.events ADD COLUMN category TEXT DEFAULT 'custom' 
    CHECK (category IN ('birthday', 'anniversary', 'travel', 'appointment', 'restaurant', 'play_area', 'custom'));
  END IF;
  
  -- Add recurrence field if it doesn't exist  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'recurrence') THEN
    ALTER TABLE public.events ADD COLUMN recurrence TEXT DEFAULT 'none'
    CHECK (recurrence IN ('none', 'annual'));
  END IF;
END $$;

-- Posts table  
-- Uses 'content' and 'media_url' columns as used in feed-view.js
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_url TEXT,
  visibility TEXT NOT NULL DEFAULT 'family',
  audience JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Islamic guidance table (removable but used in current code)
CREATE TABLE IF NOT EXISTS public.islamic_guidance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  source TEXT,
  type TEXT CHECK (type IN ('quran','hadith','advice')) DEFAULT 'quran',
  created_at TIMESTAMPTZ DEFAULT now()
);

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

-- Helper view (referenced in verify-schema.sql)
CREATE OR REPLACE VIEW public.me AS
SELECT p.* FROM public.profiles p
WHERE p.user_id = auth.uid();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.islamic_guidance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - EMAIL BASED ACCESS
-- ============================================

-- Families policies
CREATE POLICY "families_read_allowed_users" ON public.families
  FOR SELECT USING (
    auth.jwt() ->> 'email' IN (
      'yazidgeemail@gmail.com',
      'yahyageemail@gmail.com', 
      'abdessamia.mariem@gmail.com',
      'nilezat@gmail.com'
    )
  );

CREATE POLICY "families_insert_allowed_users" ON public.families
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'email' IN (
      'yazidgeemail@gmail.com',
      'yahyageemail@gmail.com',
      'abdessamia.mariem@gmail.com', 
      'nilezat@gmail.com'
    )
  );

CREATE POLICY "families_update_allowed_users" ON public.families
  FOR UPDATE USING (
    auth.jwt() ->> 'email' IN (
      'yazidgeemail@gmail.com',
      'yahyageemail@gmail.com',
      'abdessamia.mariem@gmail.com',
      'nilezat@gmail.com'
    )
  );

CREATE POLICY "families_delete_admin_only" ON public.families
  FOR DELETE USING (
    auth.jwt() ->> 'email' IN (
      'abdessamia.mariem@gmail.com',
      'nilezat@gmail.com'
    )
  );

-- Profiles policies
CREATE POLICY "profiles_read_allowed_users" ON public.profiles
  FOR SELECT USING (
    auth.jwt() ->> 'email' IN (
      'yazidgeemail@gmail.com',
      'yahyageemail@gmail.com',
      'abdessamia.mariem@gmail.com',
      'nilezat@gmail.com'
    )
  );

CREATE POLICY "profiles_insert_allowed_users" ON public.profiles
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'email' IN (
      'yazidgeemail@gmail.com',
      'yahyageemail@gmail.com',
      'abdessamia.mariem@gmail.com',
      'nilezat@gmail.com'
    )
  );

CREATE POLICY "profiles_update_allowed_users" ON public.profiles
  FOR UPDATE USING (
    auth.jwt() ->> 'email' IN (
      'yazidgeemail@gmail.com',
      'yahyageemail@gmail.com', 
      'abdessamia.mariem@gmail.com',
      'nilezat@gmail.com'
    )
  );

CREATE POLICY "profiles_delete_admin_only" ON public.profiles
  FOR DELETE USING (
    auth.jwt() ->> 'email' IN (
      'abdessamia.mariem@gmail.com',
      'nilezat@gmail.com'
    )
  );

-- Events policies
CREATE POLICY "events_read_allowed_users" ON public.events
  FOR SELECT USING (
    auth.jwt() ->> 'email' IN (
      'yazidgeemail@gmail.com',
      'yahyageemail@gmail.com',
      'abdessamia.mariem@gmail.com',
      'nilezat@gmail.com'
    )
  );

CREATE POLICY "events_insert_allowed_users" ON public.events
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'email' IN (
      'yazidgeemail@gmail.com',
      'yahyageemail@gmail.com',
      'abdessamia.mariem@gmail.com',
      'nilezat@gmail.com'
    )
  );

CREATE POLICY "events_update_allowed_users" ON public.events
  FOR UPDATE USING (
    auth.jwt() ->> 'email' IN (
      'yazidgeemail@gmail.com',
      'yahyageemail@gmail.com',
      'abdessamia.mariem@gmail.com',
      'nilezat@gmail.com'
    )
  );

CREATE POLICY "events_delete_admin_only" ON public.events
  FOR DELETE USING (
    auth.jwt() ->> 'email' IN (
      'abdessamia.mariem@gmail.com',
      'nilezat@gmail.com'
    )
  );

-- Posts policies
CREATE POLICY "posts_read_allowed_users" ON public.posts
  FOR SELECT USING (
    auth.jwt() ->> 'email' IN (
      'yazidgeemail@gmail.com',
      'yahyageemail@gmail.com',
      'abdessamia.mariem@gmail.com',
      'nilezat@gmail.com'
    )
  );

CREATE POLICY "posts_insert_allowed_users" ON public.posts
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'email' IN (
      'yazidgeemail@gmail.com',
      'yahyageemail@gmail.com',
      'abdessamia.mariem@gmail.com',
      'nilezat@gmail.com'
    )
  );

CREATE POLICY "posts_update_allowed_users" ON public.posts
  FOR UPDATE USING (
    auth.jwt() ->> 'email' IN (
      'yazidgeemail@gmail.com',
      'yahyageemail@gmail.com',
      'abdessamia.mariem@gmail.com',
      'nilezat@gmail.com'
    )
  );

CREATE POLICY "posts_delete_admin_only" ON public.posts
  FOR DELETE USING (
    auth.jwt() ->> 'email' IN (
      'abdessamia.mariem@gmail.com',
      'nilezat@gmail.com'
    )
  );

-- Islamic guidance policies
CREATE POLICY "islamic_guidance_read_allowed_users" ON public.islamic_guidance
  FOR SELECT USING (
    auth.jwt() ->> 'email' IN (
      'yazidgeemail@gmail.com',
      'yahyageemail@gmail.com',
      'abdessamia.mariem@gmail.com',
      'nilezat@gmail.com'
    )
  );

CREATE POLICY "islamic_guidance_insert_allowed_users" ON public.islamic_guidance
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'email' IN (
      'yazidgeemail@gmail.com',
      'yahyageemail@gmail.com',
      'abdessamia.mariem@gmail.com',
      'nilezat@gmail.com'
    )
  );

CREATE POLICY "islamic_guidance_update_allowed_users" ON public.islamic_guidance
  FOR UPDATE USING (
    auth.jwt() ->> 'email' IN (
      'yazidgeemail@gmail.com',
      'yahyageemail@gmail.com',
      'abdessamia.mariem@gmail.com',
      'nilezat@gmail.com'
    )
  );

CREATE POLICY "islamic_guidance_delete_admin_only" ON public.islamic_guidance
  FOR DELETE USING (
    auth.jwt() ->> 'email' IN (
      'abdessamia.mariem@gmail.com',
      'nilezat@gmail.com'
    )
  );

-- Acts policies
CREATE POLICY "acts_read_allowed_users" ON public.acts
  FOR SELECT USING (
    auth.jwt() ->> 'email' IN (
      'yazidgeemail@gmail.com',
      'yahyageemail@gmail.com',
      'abdessamia.mariem@gmail.com',
      'nilezat@gmail.com'
    )
  );

CREATE POLICY "acts_insert_allowed_users" ON public.acts
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'email' IN (
      'yazidgeemail@gmail.com',
      'yahyageemail@gmail.com',
      'abdessamia.mariem@gmail.com',
      'nilezat@gmail.com'
    )
  );

CREATE POLICY "acts_update_allowed_users" ON public.acts
  FOR UPDATE USING (
    auth.jwt() ->> 'email' IN (
      'yazidgeemail@gmail.com',
      'yahyageemail@gmail.com',
      'abdessamia.mariem@gmail.com',
      'nilezat@gmail.com'
    )
  );

CREATE POLICY "acts_delete_admin_only" ON public.acts
  FOR DELETE USING (
    auth.jwt() ->> 'email' IN (
      'abdessamia.mariem@gmail.com',
      'nilezat@gmail.com'
    )
  );

-- Feedback policies
CREATE POLICY "feedback_read_allowed_users" ON public.feedback
  FOR SELECT USING (
    auth.jwt() ->> 'email' IN (
      'yazidgeemail@gmail.com',
      'yahyageemail@gmail.com',
      'abdessamia.mariem@gmail.com',
      'nilezat@gmail.com'
    )
  );

CREATE POLICY "feedback_insert_allowed_users" ON public.feedback
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'email' IN (
      'yazidgeemail@gmail.com',
      'yahyageemail@gmail.com',
      'abdessamia.mariem@gmail.com',
      'nilezat@gmail.com'
    )
  );

CREATE POLICY "feedback_update_allowed_users" ON public.feedback
  FOR UPDATE USING (
    auth.jwt() ->> 'email' IN (
      'yazidgeemail@gmail.com',
      'yahyageemail@gmail.com',
      'abdessamia.mariem@gmail.com',
      'nilezat@gmail.com'
    )
  );

CREATE POLICY "feedback_delete_admin_only" ON public.feedback
  FOR DELETE USING (
    auth.jwt() ->> 'email' IN (
      'abdessamia.mariem@gmail.com',
      'nilezat@gmail.com'
    )
  );

-- Notes policies
CREATE POLICY "notes_read_allowed_users" ON public.notes
  FOR SELECT USING (
    auth.jwt() ->> 'email' IN (
      'yazidgeemail@gmail.com',
      'yahyageemail@gmail.com',
      'abdessamia.mariem@gmail.com',
      'nilezat@gmail.com'
    )
  );

CREATE POLICY "notes_insert_allowed_users" ON public.notes
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'email' IN (
      'yazidgeemail@gmail.com',
      'yahyageemail@gmail.com',
      'abdessamia.mariem@gmail.com',
      'nilezat@gmail.com'
    )
  );

CREATE POLICY "notes_update_allowed_users" ON public.notes
  FOR UPDATE USING (
    auth.jwt() ->> 'email' IN (
      'yazidgeemail@gmail.com',
      'yahyageemail@gmail.com',
      'abdessamia.mariem@gmail.com',
      'nilezat@gmail.com'
    )
  );

CREATE POLICY "notes_delete_admin_only" ON public.notes
  FOR DELETE USING (
    auth.jwt() ->> 'email' IN (
      'abdessamia.mariem@gmail.com',
      'nilezat@gmail.com'
    )
  );

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_family_id ON public.profiles(family_id);
CREATE INDEX IF NOT EXISTS idx_events_family_id ON public.events(family_id);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_posts_family_id ON public.posts(family_id);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at);
CREATE INDEX IF NOT EXISTS idx_islamic_guidance_family_id ON public.islamic_guidance(family_id);
CREATE INDEX IF NOT EXISTS idx_acts_family_id ON public.acts(family_id);
CREATE INDEX IF NOT EXISTS idx_acts_user_id ON public.acts(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_family_id ON public.feedback(family_id);
CREATE INDEX IF NOT EXISTS idx_notes_family_id ON public.notes(family_id);

-- ============================================
-- COMPLETE SCHEMA INITIALIZATION
-- ============================================