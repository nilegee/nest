-- ============================================
-- Migration: Row Level Security (RLS) Policies
-- Version: 20250816000600
-- Dependencies: All table migrations (20250816000100-20250816000500)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.islamic_guidance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

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
CREATE POLICY "events_family_read" ON public.events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.family_id = events.family_id
    )
  );

CREATE POLICY "events_family_insert" ON public.events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.family_id = events.family_id
    )
  );

CREATE POLICY "events_family_update" ON public.events
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.family_id = events.family_id
    )
  );

CREATE POLICY "events_family_delete" ON public.events
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.family_id = events.family_id
    )
  );

-- Posts policies
CREATE POLICY "posts_family_read" ON public.posts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.family_id = posts.family_id
    )
  );

CREATE POLICY "posts_family_insert" ON public.posts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.family_id = posts.family_id
    )
  );

CREATE POLICY "posts_author_update" ON public.posts
  FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "posts_author_delete" ON public.posts
  FOR DELETE USING (author_id = auth.uid());

-- Islamic guidance policies
CREATE POLICY "islamic_guidance_read_all" ON public.islamic_guidance
  FOR SELECT USING (public.is_whitelisted_email(auth.jwt() ->> 'email'));

CREATE POLICY "islamic_guidance_admin_modify" ON public.islamic_guidance
  FOR ALL USING (
    auth.jwt() ->> 'email' IN (
      'abdessamia.mariem@gmail.com',
      'nilezat@gmail.com'
    )
  );

-- Acts policies
CREATE POLICY "acts_family_read" ON public.acts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.family_id = acts.family_id
    )
  );

CREATE POLICY "acts_family_insert" ON public.acts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.family_id = acts.family_id
    )
  );

CREATE POLICY "acts_family_update" ON public.acts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.family_id = acts.family_id
    )
  );

CREATE POLICY "acts_family_delete" ON public.acts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.family_id = acts.family_id
    )
  );

-- Feedback policies
CREATE POLICY "feedback_family_read" ON public.feedback
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.family_id = feedback.family_id
    )
  );

CREATE POLICY "feedback_family_insert" ON public.feedback
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.family_id = feedback.family_id
    )
  );

CREATE POLICY "feedback_author_update" ON public.feedback
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "feedback_author_delete" ON public.feedback
  FOR DELETE USING (user_id = auth.uid());

-- Notes policies (private to user)
CREATE POLICY "notes_user_read" ON public.notes
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notes_user_insert" ON public.notes
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "notes_user_update" ON public.notes
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "notes_user_delete" ON public.notes
  FOR DELETE USING (user_id = auth.uid());

-- ============================================
-- END OF MIGRATION: Row Level Security (RLS) Policies
-- ============================================