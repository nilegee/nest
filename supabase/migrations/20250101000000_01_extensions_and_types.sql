-- ============================================
-- Migration 01: Extensions and Custom Types
-- Provides foundational database extensions and custom types
-- ============================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Custom types
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'member_role') THEN
    CREATE TYPE public.member_role AS ENUM ('admin','member');
  END IF;
END $$;

-- ============================================
-- ROLLBACK
-- ============================================
-- To rollback this migration:
-- DROP TYPE IF EXISTS public.member_role;
-- DROP EXTENSION IF EXISTS "pgcrypto";