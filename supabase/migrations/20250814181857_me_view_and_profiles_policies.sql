-- 20250814181857_me_view_and_profiles_policies.sql
-- Bootstrap profiles + me view + safe RLS, idempotent after DROP SCHEMA public

-- 0) Safety: required enum/type (or fall back to text if enum absent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'member_role' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.member_role AS ENUM ('admin','member');
  END IF;
END $$;

-- 1) Helper function to maintain updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'set_updated_at' AND n.nspname = 'public'
  ) THEN
    CREATE OR REPLACE FUNCTION public.set_updated_at()
    RETURNS trigger AS $BODY$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $BODY$ LANGUAGE plpgsql;
  END IF;
END $$;

-- 2) Ensure families table exists (needed by profiles.family_id FK). No-op if already created by earlier migrations.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='families'
  ) THEN
    CREATE TABLE public.families (
      id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text UNIQUE NOT NULL
    );
  END IF;
END $$;

-- 3) Create profiles table if missing
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id    uuid PRIMARY KEY,
  email      citext UNIQUE,
  full_name  text,
  avatar_url text,
  family_id  uuid REFERENCES public.families(id) ON DELETE SET NULL,
  role       public.member_role NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3a) Keep updated_at fresh
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'profiles_set_updated_at'
  ) THEN
    CREATE TRIGGER profiles_set_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- 4) Auto-create profile on signup (auth.users → public.profiles)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, avatar_url)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name',''), COALESCE(NEW.raw_user_meta_data->>'avatar_url',''))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END $$;

DO $$
BEGIN
  -- Drop if exists to avoid duplicate trigger errors across replays
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='on_auth_user_created') THEN
    DROP TRIGGER on_auth_user_created ON auth.users;
  END IF;
  CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
END $$;

-- 5) RLS on profiles: self can read/update; inserts happen via trigger/service role
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='profiles_select_self'
  ) THEN
    CREATE POLICY profiles_select_self
      ON public.profiles FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='profiles_update_self'
  ) THEN
    CREATE POLICY profiles_update_self
      ON public.profiles FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 6) me view: current user's profile + family name (safe to recreate)
CREATE OR REPLACE VIEW public.me AS
SELECT
  p.user_id,
  p.email,
  p.full_name,
  p.avatar_url,
  p.role,
  p.family_id,
  f.name AS family_name,
  p.created_at,
  p.updated_at
FROM public.profiles p
LEFT JOIN public.families f ON f.id = p.family_id
WHERE p.user_id = auth.uid();

-- 7) Convenience minimal view if you also need a compact variant
CREATE OR REPLACE VIEW public.me_min AS
SELECT p.user_id, p.full_name, p.role
FROM public.profiles p
WHERE p.user_id = auth.uid();

-- Done.