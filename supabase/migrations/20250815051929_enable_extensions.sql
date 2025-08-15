-- Enable required extensions (safe to re-run)
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;      -- for gen_random_uuid()
-- Add others here if we adopt them later:
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";