-- 20250815000000_fix_console_errors.sql
-- Fix console errors by adding missing columns and RLS policies

-- 1) Add missing dob column to profiles table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='profiles' AND column_name='dob'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN dob date;
  END IF;
END $$;

-- 2) Add family member access policy for profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='profiles' AND policyname='profiles_select_family'
  ) THEN
    CREATE POLICY profiles_select_family
      ON public.profiles FOR SELECT
      USING (family_id = (select family_id from public.profiles where user_id = auth.uid()));
  END IF;
END $$;

-- 3) Add missing INSERT policy for nudges table (FamilyBot needs to create nudges)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='nudges' AND policyname='nudges_insert_family'
  ) THEN
    CREATE POLICY nudges_insert_family
      ON public.nudges FOR INSERT
      WITH CHECK (family_id = (select family_id from public.profiles where user_id = auth.uid()));
  END IF;
END $$;

-- 4) Add missing INSERT policy for preferences table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='preferences' AND policyname='preferences_insert_self'
  ) THEN
    CREATE POLICY preferences_insert_self
      ON public.preferences FOR INSERT
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- Done.