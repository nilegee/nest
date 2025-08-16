-- ============================================
-- Migration: Profiles Family Scope Policy
-- Version: 20250816000900
-- Depends on: 20250816000600_rls_policies.sql
-- ============================================

-- Drop the broad read policy first (all whitelisted emails)
DROP POLICY IF EXISTS profiles_read_allowed_users ON public.profiles;

-- Replace with a family-scoped read policy
CREATE POLICY "profiles_family_scope"
ON public.profiles
FOR SELECT USING (
  family_id IN (
    SELECT family_id
    FROM public.profiles
    WHERE user_id = auth.uid()
  )
);

-- Keep existing insert/update/delete policies as-is
-- Insert: whitelisted email can insert their own profile
-- Update/Delete: restricted to admins or same user (already defined)

-- ============================================
-- END OF MIGRATION
-- ============================================
