-- ============================================
-- Migration: Performance Indexes
-- Version: 20250816000700
-- Dependencies: All table and RLS migrations
-- ============================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_family_id ON public.profiles(family_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- Events indexes
CREATE INDEX IF NOT EXISTS idx_events_family_id ON public.events(family_id);
CREATE INDEX IF NOT EXISTS idx_events_owner_id ON public.events(owner_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_type ON public.events(type);

-- Posts indexes
CREATE INDEX IF NOT EXISTS idx_posts_family_id ON public.posts(family_id);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);

-- Islamic guidance indexes
CREATE INDEX IF NOT EXISTS idx_islamic_guidance_content_type ON public.islamic_guidance(content_type);
CREATE INDEX IF NOT EXISTS idx_islamic_guidance_active ON public.islamic_guidance(is_active);

-- Acts indexes
CREATE INDEX IF NOT EXISTS idx_acts_family_id ON public.acts(family_id);
CREATE INDEX IF NOT EXISTS idx_acts_actor_id ON public.acts(actor_id);
CREATE INDEX IF NOT EXISTS idx_acts_recipient_id ON public.acts(recipient_id);
CREATE INDEX IF NOT EXISTS idx_acts_created_at ON public.acts(created_at DESC);

-- Feedback indexes
CREATE INDEX IF NOT EXISTS idx_feedback_family_id ON public.feedback(family_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback(status);

-- Notes indexes
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON public.notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_pinned ON public.notes(is_pinned);

-- ============================================
-- END OF MIGRATION: Performance Indexes
-- ============================================