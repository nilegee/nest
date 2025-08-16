-- ============================================
-- Migration 07: RLS Policies
-- Creates Row Level Security policies for all tables
-- Note: Email whitelist should be centralized via environment configuration
-- ============================================

-- Helper function for whitelisted emails (centralized approach)
CREATE OR REPLACE FUNCTION public.is_whitelisted_email(email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- This should be updated to read from environment or configuration table
  -- For now, maintaining the current whitelist for compatibility
  RETURN email IN (
    'yazidgeemail@gmail.com',
    'yahyageemail@gmail.com',
    'abdessamia.mariem@gmail.com',
    'nilezat@gmail.com'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Families policies
CREATE POLICY "families_read_allowed_users" ON public.families
  FOR SELECT USING (public.is_whitelisted_email(auth.jwt() ->> 'email'));

CREATE POLICY "families_insert_allowed_users" ON public.families
  FOR INSERT WITH CHECK (public.is_whitelisted_email(auth.jwt() ->> 'email'));

CREATE POLICY "families_update_allowed_users" ON public.families
  FOR UPDATE USING (public.is_whitelisted_email(auth.jwt() ->> 'email'));

CREATE POLICY "families_delete_admin_only" ON public.families
  FOR DELETE USING (
    auth.jwt() ->> 'email' IN (
      'abdessamia.mariem@gmail.com',
      'nilezat@gmail.com'
    )
  );

-- Profiles policies
CREATE POLICY "profiles_read_allowed_users" ON public.profiles
  FOR SELECT USING (public.is_whitelisted_email(auth.jwt() ->> 'email'));

CREATE POLICY "profiles_insert_allowed_users" ON public.profiles
  FOR INSERT WITH CHECK (public.is_whitelisted_email(auth.jwt() ->> 'email'));

CREATE POLICY "profiles_update_allowed_users" ON public.profiles
  FOR UPDATE USING (public.is_whitelisted_email(auth.jwt() ->> 'email'));

CREATE POLICY "profiles_delete_admin_only" ON public.profiles
  FOR DELETE USING (
    auth.jwt() ->> 'email' IN (
      'abdessamia.mariem@gmail.com',
      'nilezat@gmail.com'
    )
  );

-- Events policies
CREATE POLICY "events_read_allowed_users" ON public.events
  FOR SELECT USING (public.is_whitelisted_email(auth.jwt() ->> 'email'));

CREATE POLICY "events_insert_allowed_users" ON public.events
  FOR INSERT WITH CHECK (public.is_whitelisted_email(auth.jwt() ->> 'email'));

CREATE POLICY "events_update_allowed_users" ON public.events
  FOR UPDATE USING (public.is_whitelisted_email(auth.jwt() ->> 'email'));

CREATE POLICY "events_delete_admin_only" ON public.events
  FOR DELETE USING (
    auth.jwt() ->> 'email' IN (
      'abdessamia.mariem@gmail.com',
      'nilezat@gmail.com'
    )
  );

-- Posts policies
CREATE POLICY "posts_read_allowed_users" ON public.posts
  FOR SELECT USING (public.is_whitelisted_email(auth.jwt() ->> 'email'));

CREATE POLICY "posts_insert_allowed_users" ON public.posts
  FOR INSERT WITH CHECK (public.is_whitelisted_email(auth.jwt() ->> 'email'));

CREATE POLICY "posts_update_allowed_users" ON public.posts
  FOR UPDATE USING (public.is_whitelisted_email(auth.jwt() ->> 'email'));

CREATE POLICY "posts_delete_admin_only" ON public.posts
  FOR DELETE USING (
    auth.jwt() ->> 'email' IN (
      'abdessamia.mariem@gmail.com',
      'nilezat@gmail.com'
    )
  );

-- Islamic guidance policies
CREATE POLICY "islamic_guidance_read_allowed_users" ON public.islamic_guidance
  FOR SELECT USING (public.is_whitelisted_email(auth.jwt() ->> 'email'));

CREATE POLICY "islamic_guidance_insert_allowed_users" ON public.islamic_guidance
  FOR INSERT WITH CHECK (public.is_whitelisted_email(auth.jwt() ->> 'email'));

CREATE POLICY "islamic_guidance_update_allowed_users" ON public.islamic_guidance
  FOR UPDATE USING (public.is_whitelisted_email(auth.jwt() ->> 'email'));

CREATE POLICY "islamic_guidance_delete_admin_only" ON public.islamic_guidance
  FOR DELETE USING (
    auth.jwt() ->> 'email' IN (
      'abdessamia.mariem@gmail.com',
      'nilezat@gmail.com'
    )
  );

-- Acts policies
CREATE POLICY "acts_read_allowed_users" ON public.acts
  FOR SELECT USING (public.is_whitelisted_email(auth.jwt() ->> 'email'));

CREATE POLICY "acts_insert_allowed_users" ON public.acts
  FOR INSERT WITH CHECK (public.is_whitelisted_email(auth.jwt() ->> 'email'));

CREATE POLICY "acts_update_allowed_users" ON public.acts
  FOR UPDATE USING (public.is_whitelisted_email(auth.jwt() ->> 'email'));

CREATE POLICY "acts_delete_admin_only" ON public.acts
  FOR DELETE USING (
    auth.jwt() ->> 'email' IN (
      'abdessamia.mariem@gmail.com',
      'nilezat@gmail.com'
    )
  );

-- Feedback policies
CREATE POLICY "feedback_read_allowed_users" ON public.feedback
  FOR SELECT USING (public.is_whitelisted_email(auth.jwt() ->> 'email'));

CREATE POLICY "feedback_insert_allowed_users" ON public.feedback
  FOR INSERT WITH CHECK (public.is_whitelisted_email(auth.jwt() ->> 'email'));

CREATE POLICY "feedback_update_allowed_users" ON public.feedback
  FOR UPDATE USING (public.is_whitelisted_email(auth.jwt() ->> 'email'));

CREATE POLICY "feedback_delete_admin_only" ON public.feedback
  FOR DELETE USING (
    auth.jwt() ->> 'email' IN (
      'abdessamia.mariem@gmail.com',
      'nilezat@gmail.com'
    )
  );

-- Notes policies
CREATE POLICY "notes_read_allowed_users" ON public.notes
  FOR SELECT USING (public.is_whitelisted_email(auth.jwt() ->> 'email'));

CREATE POLICY "notes_insert_allowed_users" ON public.notes
  FOR INSERT WITH CHECK (public.is_whitelisted_email(auth.jwt() ->> 'email'));

CREATE POLICY "notes_update_allowed_users" ON public.notes
  FOR UPDATE USING (public.is_whitelisted_email(auth.jwt() ->> 'email'));

CREATE POLICY "notes_delete_admin_only" ON public.notes
  FOR DELETE USING (
    auth.jwt() ->> 'email' IN (
      'abdessamia.mariem@gmail.com',
      'nilezat@gmail.com'
    )
  );

-- ============================================
-- ROLLBACK
-- ============================================
-- To rollback this migration:
-- DROP POLICY IF EXISTS "notes_delete_admin_only" ON public.notes;
-- DROP POLICY IF EXISTS "notes_update_allowed_users" ON public.notes;
-- DROP POLICY IF EXISTS "notes_insert_allowed_users" ON public.notes;
-- DROP POLICY IF EXISTS "notes_read_allowed_users" ON public.notes;
-- DROP POLICY IF EXISTS "feedback_delete_admin_only" ON public.feedback;
-- DROP POLICY IF EXISTS "feedback_update_allowed_users" ON public.feedback;
-- DROP POLICY IF EXISTS "feedback_insert_allowed_users" ON public.feedback;
-- DROP POLICY IF EXISTS "feedback_read_allowed_users" ON public.feedback;
-- DROP POLICY IF EXISTS "acts_delete_admin_only" ON public.acts;
-- DROP POLICY IF EXISTS "acts_update_allowed_users" ON public.acts;
-- DROP POLICY IF EXISTS "acts_insert_allowed_users" ON public.acts;
-- DROP POLICY IF EXISTS "acts_read_allowed_users" ON public.acts;
-- DROP POLICY IF EXISTS "islamic_guidance_delete_admin_only" ON public.islamic_guidance;
-- DROP POLICY IF EXISTS "islamic_guidance_update_allowed_users" ON public.islamic_guidance;
-- DROP POLICY IF EXISTS "islamic_guidance_insert_allowed_users" ON public.islamic_guidance;
-- DROP POLICY IF EXISTS "islamic_guidance_read_allowed_users" ON public.islamic_guidance;
-- DROP POLICY IF EXISTS "posts_delete_admin_only" ON public.posts;
-- DROP POLICY IF EXISTS "posts_update_allowed_users" ON public.posts;
-- DROP POLICY IF EXISTS "posts_insert_allowed_users" ON public.posts;
-- DROP POLICY IF EXISTS "posts_read_allowed_users" ON public.posts;
-- DROP POLICY IF EXISTS "events_delete_admin_only" ON public.events;
-- DROP POLICY IF EXISTS "events_update_allowed_users" ON public.events;
-- DROP POLICY IF EXISTS "events_insert_allowed_users" ON public.events;
-- DROP POLICY IF EXISTS "events_read_allowed_users" ON public.events;
-- DROP POLICY IF EXISTS "profiles_delete_admin_only" ON public.profiles;
-- DROP POLICY IF EXISTS "profiles_update_allowed_users" ON public.profiles;
-- DROP POLICY IF EXISTS "profiles_insert_allowed_users" ON public.profiles;
-- DROP POLICY IF EXISTS "profiles_read_allowed_users" ON public.profiles;
-- DROP POLICY IF EXISTS "families_delete_admin_only" ON public.families;
-- DROP POLICY IF EXISTS "families_update_allowed_users" ON public.families;
-- DROP POLICY IF EXISTS "families_insert_allowed_users" ON public.families;
-- DROP POLICY IF EXISTS "families_read_allowed_users" ON public.families;
-- DROP FUNCTION IF EXISTS public.is_whitelisted_email(TEXT);