-- ============================================
-- Migration: Core Tables (Families and Profiles)
-- Version: 20250816000100
-- Dependencies: 20250816000000_extensions_and_types.sql
-- ============================================

-- Families table
CREATE TABLE IF NOT EXISTS public.families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Profiles table (linked to auth.users)
-- Primary key is user_id to match code usage
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  full_name TEXT,
  dob DATE,
  avatar_url TEXT,
  role public.member_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Helper view (referenced in verify-schema.sql)
CREATE OR REPLACE VIEW public.me AS
SELECT p.* FROM public.profiles p
WHERE p.user_id = auth.uid();

-- ============================================
-- END OF MIGRATION: Core Tables (Families and Profiles)
-- ============================================