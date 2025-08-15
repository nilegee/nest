-- scripts/seed_minimal.sql
-- Idempotent seed for minimal bootstrapping

BEGIN;

SET search_path = public;

-- Extensions
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Ensure enum (used by email_whitelist.role)
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

-- Ensure families table
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
    -- unique name constraint (visible to ORMs)
    ALTER TABLE public.families
      ADD CONSTRAINT families_name_key UNIQUE (name);
  END IF;
END $$;

-- Seed default family
INSERT INTO public.families (name)
VALUES ('G Family')
ON CONFLICT (name) DO NOTHING;

-- Ensure email_whitelist table (create-or-evolve)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='email_whitelist'
  ) THEN
    CREATE TABLE public.email_whitelist (
      email      citext PRIMARY KEY,
      role       public.member_role NOT NULL DEFAULT 'member',
      created_at timestamptz NOT NULL DEFAULT now()
    );
  ELSE
    -- normalize column shapes/types if the table already exists
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='email_whitelist' AND column_name='email'
    ) THEN
      ALTER TABLE public.email_whitelist ADD COLUMN email citext;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='email_whitelist'
        AND column_name='email' AND data_type <> 'citext'
    ) THEN
      ALTER TABLE public.email_whitelist
        ALTER COLUMN email TYPE citext USING email::citext;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='email_whitelist' AND column_name='role'
    ) THEN
      ALTER TABLE public.email_whitelist
        ADD COLUMN role public.member_role NOT NULL DEFAULT 'member';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='email_whitelist' AND column_name='created_at'
    ) THEN
      ALTER TABLE public.email_whitelist
        ADD COLUMN created_at timestamptz NOT NULL DEFAULT now();
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conrelid='public.email_whitelist'::regclass AND contype='p'
    ) THEN
      ALTER TABLE public.email_whitelist ADD PRIMARY KEY (email);
    END IF;
  END IF;
END $$;

-- Case-insensitive unique protection (defensive)
CREATE UNIQUE INDEX IF NOT EXISTS email_whitelist_email_lower_key
  ON public.email_whitelist (lower(email::text));

-- Seed emails (safe to re-run)
INSERT INTO public.email_whitelist (email, role) VALUES
  ('yazidgeemail@gmail.com', 'member'),
  ('yahyageemail@gmail.com', 'member'),
  ('abdessamia.mariem@gmail.com', 'member'),
  ('nilezat@gmail.com', 'admin')
ON CONFLICT (email) DO NOTHING;

COMMIT;
