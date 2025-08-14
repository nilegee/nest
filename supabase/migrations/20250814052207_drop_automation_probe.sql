-- Migration: Drop automation probe table after testing
-- This migration runs after the add_automation_probe migration to clean up the test table

DROP TABLE IF EXISTS _automation_probe;