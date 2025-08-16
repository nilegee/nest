-- ============================================
-- Migration 03: Events Tables
-- Creates events system for family calendar functionality
-- ============================================

-- Events table
-- Matches exact structure from events-view.js usage
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  event_date DATE NOT NULL DEFAULT CURRENT_DATE,
  type TEXT CHECK (type IN ('birthday','anniversary','custom')) DEFAULT 'custom',
  location TEXT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add new fields for enhanced events system
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS recurrence_pattern JSONB,
ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{"email": true, "push": false}',
ADD COLUMN IF NOT EXISTS attendees JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Enable RLS on events table
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ROLLBACK
-- ============================================
-- To rollback this migration:
-- DROP TABLE IF EXISTS public.events;