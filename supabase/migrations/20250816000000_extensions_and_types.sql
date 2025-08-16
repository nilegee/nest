-- ============================================
-- Migration: Extensions and Custom Types
-- Version: 20250816000000
-- Dependencies: None (Base migration)
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
-- END OF MIGRATION: Extensions and Custom Types
-- ============================================