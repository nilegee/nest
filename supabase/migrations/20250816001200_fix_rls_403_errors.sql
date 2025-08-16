-- ============================================
-- Migration: Fix RLS 403 Errors for Whitelisted Users
-- Version: 20250816001200
-- Fix the chicken-and-egg problem with profile creation
-- ============================================

-- Drop conflicting policies first
DROP POLICY IF EXISTS "profiles_family_scope" ON public.profiles;
DROP POLICY IF EXISTS "profiles_read_allowed_users" ON public.profiles;
DROP POLICY IF EXISTS "families_read_allowed_users" ON public.families;

-- Create proper profiles read policy that allows:
-- 1. Users to read their own profile
-- 2. Whitelisted users to read all profiles (needed for profile creation flow)
CREATE POLICY "profiles_read_comprehensive"
ON public.profiles
FOR SELECT USING (
  auth.uid() = user_id 
  OR public.is_whitelisted_email(auth.jwt() ->> 'email')
);

-- Create proper families read policy that allows:
-- 1. Family members to read their family
-- 2. Whitelisted users to read all families (needed for profile creation flow)
CREATE POLICY "families_read_comprehensive"
ON public.families
FOR SELECT USING (
  id IN (
    SELECT family_id
    FROM public.profiles
    WHERE user_id = auth.uid()
  )
  OR public.is_whitelisted_email(auth.jwt() ->> 'email')
);

-- Ensure INSERT policies exist for families (whitelisted users can create families)
DROP POLICY IF EXISTS "families_insert_allowed_users" ON public.families;
CREATE POLICY "families_insert_comprehensive"
ON public.families
FOR INSERT WITH CHECK (
  public.is_whitelisted_email(auth.jwt() ->> 'email')
);

-- Ensure INSERT policies exist for profiles (whitelisted users can create profiles)
DROP POLICY IF EXISTS "profiles_insert_allowed_users" ON public.profiles;
CREATE POLICY "profiles_insert_comprehensive"
ON public.profiles
FOR INSERT WITH CHECK (
  auth.uid() = user_id 
  AND public.is_whitelisted_email(auth.jwt() ->> 'email')
);

-- ============================================
-- END OF MIGRATION: Fix RLS 403 Errors
-- ============================================