-- ============================================
-- Ensure profiles.user_id is UNIQUE
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_user_id_key'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    EXECUTE 'ALTER TABLE public.profiles
             ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id)';
  END IF;
END $$;

-- ============================================
-- Fix posts table foreign key to reference user_id
-- ============================================

ALTER TABLE IF EXISTS public.posts
DROP CONSTRAINT IF EXISTS posts_author_id_fkey;

ALTER TABLE IF EXISTS public.posts
ADD CONSTRAINT posts_author_id_fkey
FOREIGN KEY (author_id)
REFERENCES public.profiles(user_id)
ON DELETE CASCADE;

-- ============================================
-- RLS POLICIES FIXES (unchanged from before)
-- ============================================

DROP POLICY IF EXISTS "profiles self read" ON public.profiles;
DROP POLICY IF EXISTS "profiles self update" ON public.profiles;

CREATE POLICY "profiles self read" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "profiles self update" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- EVENTS TABLE POLICIES FIX
-- ============================================

DROP POLICY IF EXISTS "events family read" ON public.events;
DROP POLICY IF EXISTS "events family insert" ON public.events;
DROP POLICY IF EXISTS "events family update" ON public.events;
DROP POLICY IF EXISTS "events family delete" ON public.events;

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
DROP POLICY IF EXISTS "posts author update" ON public.posts;
DROP POLICY IF EXISTS "posts author delete" ON public.posts;

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
