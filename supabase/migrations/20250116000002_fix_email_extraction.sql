-- Fix JWT email extraction in RLS policies
-- This migration fixes the get_current_user_email() function that was causing 403 errors

-- Simplify the get_current_user_email function to use the most reliable approach
-- The original auth.jwt() ->> 'email' was working, so let's use that primarily
CREATE OR REPLACE FUNCTION get_current_user_email()
RETURNS TEXT AS $$
BEGIN
  -- Use the primary email field from JWT - this is the most reliable
  RETURN auth.jwt() ->> 'email';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;