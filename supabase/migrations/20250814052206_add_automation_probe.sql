-- Migration: Add automation probe table for CI/CD testing
-- This table is used to verify that the Supabase migration pipeline works correctly

CREATE TABLE IF NOT EXISTS _automation_probe (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);