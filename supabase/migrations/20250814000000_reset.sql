-- 20250815_reset.sql
-- Safe destructive reset for PUBLIC objects used by FamilyNest
-- Idempotent: all drops are IF EXISTS or guarded, so replays won't fail.

SET search_path = public;

-- Ensure extensions exist (no-ops if already there)
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1) Drop views first (so table drops don't complain about dependencies)
DROP VIEW IF EXISTS public.me CASCADE;
DROP VIEW IF EXISTS public.me_min CASCADE;

-- 2) Drop triggers that might reference functions (defensive)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'profiles_set_updated_at') THEN
    EXECUTE 'DROP TRIGGER profiles_set_updated_at ON public.profiles';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    EXECUTE 'DROP TRIGGER on_auth_user_created ON auth.users';
  END IF;
END $$;

-- 3) Drop functions (if present)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'set_updated_at' AND n.nspname = 'public'
  ) THEN
    EXECUTE 'DROP FUNCTION public.set_updated_at()';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'handle_new_user' AND n.nspname = 'public'
  ) THEN
    EXECUTE 'DROP FUNCTION public.handle_new_user()';
  END IF;
END $$;

-- 4) Drop tables (CASCADE removes policies, FKs, indexes, etc.)
-- Order is mostly irrelevant thanks to CASCADE, but we keep families/profiles last for readability
DROP TABLE IF EXISTS public.signals CASCADE;
DROP TABLE IF EXISTS public.nudges CASCADE;
DROP TABLE IF EXISTS public.acts CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.posts CASCADE;
DROP TABLE IF EXISTS public.notes CASCADE;
DROP TABLE IF EXISTS public.appreciations CASCADE;
DROP TABLE IF EXISTS public.preferences CASCADE;
DROP TABLE IF EXISTS public.wishlist CASCADE;
DROP TABLE IF EXISTS public.feedback CASCADE;
DROP TABLE IF EXISTS public.email_whitelist CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.families CASCADE;

-- 5) If email_whitelist still exists and column role uses member_role, widen to text
-- (This matters if someone reorders files and drops enum after re-creating the table.)
DO $$
DECLARE
  uses_enum BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema='public'
      AND table_name='email_whitelist'
      AND column_name='role'
      AND udt_name='member_role'
  ) INTO uses_enum;

  IF uses_enum THEN
    EXECUTE 'ALTER TABLE public.email_whitelist ALTER COLUMN role TYPE text USING role::text';
  END IF;
END $$;

-- 6) Drop enum member_role only if nothing depends on it
DO $$
BEGIN
  EXECUTE 'DROP TYPE public.member_role';
EXCEPTION
  WHEN SQLSTATE '2BP01' THEN  -- dependent_objects_still_exist
    RAISE NOTICE 'Skipping DROP TYPE public.member_role — dependencies still exist.';
END $$;

-- 7) Optional: clean up leftover constraints/indexes whose tables were removed (defensive)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname='families_name_key') THEN
    EXECUTE 'ALTER TABLE IF EXISTS public.families DROP CONSTRAINT families_name_key';
  END IF;
END $$;

-- End reset
