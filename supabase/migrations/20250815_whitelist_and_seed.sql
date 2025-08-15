-- 20250815_whitelist_and_seed.sql
-- Create email whitelist table (idempotent) + minimal seed
-- Fixes: "type public.member_role does not exist"

SET search_path = public;

-- Extensions (no-ops if present)
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 0) Ensure role enum exists BEFORE any table uses it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'member_role' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.member_role AS ENUM ('admin','member');
  END IF;
END $$;

-- 1) Create or evolve email_whitelist
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
    -- Ensure required columns/types exist (idempotent evolves)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='email_whitelist' AND column_name='email'
    ) THEN
      ALTER TABLE public.email_whitelist ADD COLUMN email citext;
    END IF;

    -- Normalize email type to citext (case-insensitive)
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

    -- Ensure PK on email
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conrelid = 'public.email_whitelist'::regclass AND contype='p'
    ) THEN
      ALTER TABLE public.email_whitelist ADD PRIMARY KEY (email);
    END IF;
  END IF;
END $$;

-- 2) Functional unique index (defensive; citext already case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS email_whitelist_email_lower_key
  ON public.email_whitelist (lower(email::text));

-- 3) Optional minimal seed (safe to re-run)
INSERT INTO public.email_whitelist (email, role)
VALUES
  ('yazidgeemail@gmail.com', 'member'),
  ('yahyageemail@gmail.com', 'member'),
  ('abdessamia.mariem@gmail.com', 'member'),
  ('nilezat@gmail.com', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Done.
