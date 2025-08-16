-- ============================================
-- Migration: Events System
-- Version: 20250816000200
-- Dependencies: 20250816000100_core_tables.sql
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
  created_at TIMESTAMPTZ DEFAULT now(),
  description TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern JSONB,
  notification_settings JSONB DEFAULT '{"email": true, "push": false}',
  attendees JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- END OF MIGRATION: Events System
-- ============================================