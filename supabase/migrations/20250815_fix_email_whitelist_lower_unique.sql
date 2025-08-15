-- 20250815_fix_email_whitelist_lower_unique.sql
-- Make email whitelist exist and enforce case-insensitive uniqueness safely.

SET search_path = public;

-- Ensure required bits exist
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Ensure the role enum is available (used by email_whitelist.role)
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

-- Create the table if it doesn't exist
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
    -- If table exists, make sure columns are as expected
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='email_whitelist' AND column_name='email'
    ) THEN
      ALTER TABLE public.email_whitelist ADD COLUMN email citext;
    END IF;

    -- Coerce email column to citext if it isn't already
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

    -- Ensure email is the primary key
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conrelid = 'public.email_whitelist'::regclass
        AND contype = 'p'
    ) THEN
      ALTER TABLE public.email_whitelist
        ADD PRIMARY KEY (email);
    END IF;
  END IF;
END $$;

-- Enforce case-insensitive uniqueness via functional unique index (safe if already present)
-- (citext is already case-insensitive, but this index guarantees it even if types drift)
CREATE UNIQUE INDEX IF NOT EXISTS email_whitelist_email_lower_key
  ON public.email_whitelist (lower(email::text));

-- Done
