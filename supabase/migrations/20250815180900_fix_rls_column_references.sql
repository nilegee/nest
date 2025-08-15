-- Fix RLS Policy Column References and Foreign Key Constraints
-- Fixes 403 errors by correcting profile column references in RLS policies
-- The policies were using 'id' but the actual schema uses 'user_id' as primary key
-- Also fixes foreign key constraints that reference the wrong column

-- ============================================
-- FOREIGN KEY CONSTRAINTS FIX
-- ============================================

-- Fix posts table foreign key to reference correct column
DO $$ 
BEGIN
  -- Drop existing foreign key constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'posts_author_id_fkey' 
    AND table_name = 'posts'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.posts DROP CONSTRAINT posts_author_id_fkey;
  END IF;
  
  -- Add correct foreign key constraint  
  ALTER TABLE public.posts 
  ADD CONSTRAINT posts_author_id_fkey 
  FOREIGN KEY (author_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
END $$;

-- ============================================
-- PROFILES TABLE POLICIES FIX
-- ============================================

DROP POLICY IF EXISTS "profiles self read" ON public.profiles;
DROP POLICY IF EXISTS "profiles self update" ON public.profiles;

-- Correct policies using user_id (which is the actual primary key)
CREATE POLICY "profiles self read" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "profiles self update" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- EVENTS TABLE POLICIES FIX  
-- ============================================

DROP POLICY IF EXISTS "events family read" ON public.events;
DROP POLICY IF EXISTS "events family insert" ON public.events;

CREATE POLICY "events family read" ON public.events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.family_id = events.family_id
    )
  );

CREATE POLICY "events family insert" ON public.events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.family_id = events.family_id
    )
  );

-- Add UPDATE and DELETE policies for events (without owner_id since it was dropped)
CREATE POLICY "events family update" ON public.events
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.family_id = events.family_id
    )
  );

CREATE POLICY "events family delete" ON public.events
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.family_id = events.family_id
    )
  );

-- ============================================
-- POSTS TABLE POLICIES FIX
-- ============================================

DROP POLICY IF EXISTS "posts family read" ON public.posts;
DROP POLICY IF EXISTS "posts family insert" ON public.posts;

CREATE POLICY "posts family read" ON public.posts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.family_id = posts.family_id
    )
  );

CREATE POLICY "posts family insert" ON public.posts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.family_id = posts.family_id
    )
  );

CREATE POLICY "posts author update" ON public.posts
  FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "posts author delete" ON public.posts
  FOR DELETE USING (author_id = auth.uid());

-- ============================================
-- ISLAMIC GUIDANCE TABLE POLICIES FIX
-- ============================================

DROP POLICY IF EXISTS "guidance family read" ON public.islamic_guidance;
DROP POLICY IF EXISTS "guidance family insert" ON public.islamic_guidance;

CREATE POLICY "guidance family read" ON public.islamic_guidance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.family_id = islamic_guidance.family_id
    )
  );

CREATE POLICY "guidance family insert" ON public.islamic_guidance
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.family_id = islamic_guidance.family_id
    )
  );

-- ============================================
-- FAMILIES TABLE POLICIES FIX
-- ============================================

DROP POLICY IF EXISTS "families member read" ON public.families;

CREATE POLICY "families member read" ON public.families
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.family_id = families.id
    )
  );
