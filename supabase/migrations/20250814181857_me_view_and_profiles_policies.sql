-- 20250814181857_me_view_and_profiles_policies.sql
-- Bootstrap profiles + me view + safe RLS (idempotent)

-- Safety nets
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 0) Ensure enum
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

-- 1) updated_at helper
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

-- 2) families table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='families'
  ) THEN
    CREATE TABLE public.families (
      id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL
    );
  END IF;
END $$;

-- 2a) Uniqueness on name
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='families_name_key') THEN
    ALTER TABLE public.families
      ADD CONSTRAINT families_name_key UNIQUE (name);
  END IF;
END $$;

-- 3) profiles table (create-or-evolve)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='profiles'
  ) THEN
    CREATE TABLE public.profiles (
      user_id    uuid PRIMARY KEY,
      email      citext UNIQUE,
      full_name  text,
      avatar_url text,
      family_id  uuid REFERENCES public.families(id) ON DELETE SET NULL,
      role       public.member_role NOT NULL DEFAULT 'member',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  ELSE
    -- Add missing columns safely
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='profiles' AND column_name='email'
    ) THEN
      ALTER TABLE public.profiles ADD COLUMN email citext;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='profiles' AND column_name='full_name'
    ) THEN
      ALTER TABLE public.profiles ADD COLUMN full_name text;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='profiles' AND column_name='avatar_url'
    ) THEN
      ALTER TABLE public.profiles ADD COLUMN avatar_url text;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='profiles' AND column_name='role'
    ) THEN
      ALTER TABLE public.profiles ADD COLUMN role public.member_role NOT NULL DEFAULT 'member';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='profiles' AND column_name='family_id'
    ) THEN
      ALTER TABLE public.profiles
        ADD COLUMN family_id uuid REFERENCES public.families(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- 3a) Backfill family_id
WITH up AS (
  INSERT INTO public.families (name)
  VALUES ('G Family')
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
UPDATE public.profiles p
SET family_id = COALESCE(p.family_id, (SELECT id FROM up))
WHERE p.family_id IS NULL;

-- 3b) Helpful index
CREATE INDEX IF NOT EXISTS idx_profiles_family_id ON public.profiles (family_id);

-- 3c) updated_at trigger
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='profiles_set_updated_at') THEN
    CREATE TRIGGER profiles_set_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- 4) Auto-create profile from auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, avatar_url, family_id, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name',''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url',''),
    (SELECT id FROM public.families WHERE name='G Family' LIMIT 1),
    'member'::public.member_role
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 4a) Trigger creation (idempotent, modern syntax)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='on_auth_user_created') THEN
    DROP TRIGGER on_auth_user_created ON auth.users;
  END IF;
  CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
END $$;

-- 5) RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='profiles' AND policyname='profiles_select_self'
  ) THEN
    CREATE POLICY profiles_select_self
      ON public.profiles FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='profiles' AND policyname='profiles_update_self'
  ) THEN
    CREATE POLICY profiles_update_self
      ON public.profiles FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 6) Views
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

CREATE OR REPLACE VIEW public.me_min AS
SELECT p.user_id, p.full_name, p.role
FROM public.profiles p
WHERE p.user_id = auth.uid();

-- Done.
