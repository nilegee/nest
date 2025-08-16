-- Fix RLS policies to handle JWT email format correctly
-- This migration fixes console errors with 403 Forbidden on profiles and posts

-- First, let's update the whitelist function to be more robust
CREATE OR REPLACE FUNCTION is_whitelisted_email(email_to_check TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Handle null or empty email
  IF email_to_check IS NULL OR email_to_check = '' THEN
    RETURN FALSE;
  END IF;
  
  RETURN email_to_check = ANY(ARRAY[
    'yazidgeemail@gmail.com',
    'yahyageemail@gmail.com', 
    'abdessamia.mariem@gmail.com',
    'nilezat@gmail.com'
  ]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a helper function to get the current user's email from JWT
CREATE OR REPLACE FUNCTION get_current_user_email()
RETURNS TEXT AS $$
BEGIN
  -- Try different possible locations for email in JWT
  RETURN COALESCE(
    auth.jwt() ->> 'email',
    auth.jwt() ->> 'user_email', 
    auth.jwt() ->> 'aud'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Whitelisted users can view profiles" ON profiles;
DROP POLICY IF EXISTS "Whitelisted users can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Family members can view posts" ON posts;
DROP POLICY IF EXISTS "Family members can insert posts" ON posts;
DROP POLICY IF EXISTS "Authors can update own posts" ON posts;
DROP POLICY IF EXISTS "Authors can delete own posts" ON posts;

-- Recreate profiles policies with improved email checking
CREATE POLICY "Whitelisted users can view profiles"
  ON profiles FOR SELECT
  USING (is_whitelisted_email(get_current_user_email()));

CREATE POLICY "Whitelisted users can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (
    is_whitelisted_email(get_current_user_email()) AND
    email = get_current_user_email() AND
    user_id = auth.uid()
  );

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (
    user_id = auth.uid() AND
    is_whitelisted_email(get_current_user_email())
  )
  WITH CHECK (
    user_id = auth.uid() AND
    is_whitelisted_email(get_current_user_email())
  );

-- Recreate posts policies with improved email checking
CREATE POLICY "Family members can view posts"
  ON posts FOR SELECT
  USING (
    is_whitelisted_email(get_current_user_email()) AND
    family_id IN (
      SELECT family_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Family members can insert posts"
  ON posts FOR INSERT
  WITH CHECK (
    is_whitelisted_email(get_current_user_email()) AND
    author_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    ) AND
    family_id IN (
      SELECT family_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Authors can update own posts"
  ON posts FOR UPDATE
  USING (
    is_whitelisted_email(get_current_user_email()) AND
    author_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    is_whitelisted_email(get_current_user_email()) AND
    author_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Authors can delete own posts"
  ON posts FOR DELETE
  USING (
    is_whitelisted_email(get_current_user_email()) AND
    author_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );