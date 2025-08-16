-- ============================================
-- Migration: Fix RLS Policies for Read Access
-- Version: 20250816001100
-- Dependencies: 20250816000600_rls_policies.sql
-- ============================================

-- PROFILES: allow user to read their own row OR if whitelisted
DROP POLICY IF EXISTS "profiles_read_allowed_users" ON public.profiles;

CREATE POLICY "profiles_read_allowed_users"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = user_id
  OR public.is_whitelisted_email(auth.jwt()->>'email')
);

-- FAMILIES: allow read if user belongs to family OR if whitelisted
DROP POLICY IF EXISTS "families_read_allowed_users" ON public.families;

CREATE POLICY "families_read_allowed_users"
ON public.families
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.family_id = families.id
      AND p.user_id = auth.uid()
  )
  OR public.is_whitelisted_email(auth.jwt()->>'email')
);

-- EVENTS: make sure users can always read events if they belong to family
DROP POLICY IF EXISTS "events_family_read" ON public.events;

CREATE POLICY "events_family_read"
ON public.events
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.family_id = events.family_id
      AND p.user_id = auth.uid()
  )
);

-- POSTS: ensure family members can read posts
DROP POLICY IF EXISTS "posts_family_read" ON public.posts;

CREATE POLICY "posts_family_read"
ON public.posts
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.family_id = posts.family_id
      AND p.user_id = auth.uid()
  )
);

-- ISLAMIC GUIDANCE: make it publicly readable (any logged-in user)
DROP POLICY IF EXISTS "islamic_guidance_read_all" ON public.islamic_guidance;

CREATE POLICY "islamic_guidance_read_all"
ON public.islamic_guidance
FOR SELECT
USING (true);

-- ============================================
-- END OF MIGRATION
-- ============================================
