-- ============================================
-- Migration 08: Performance Indexes
-- Creates database indexes for optimal query performance
-- ============================================

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_profiles_family_id ON public.profiles(family_id);
CREATE INDEX IF NOT EXISTS idx_events_family_id ON public.events(family_id);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_posts_family_id ON public.posts(family_id);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at);
CREATE INDEX IF NOT EXISTS idx_islamic_guidance_family_id ON public.islamic_guidance(family_id);
CREATE INDEX IF NOT EXISTS idx_acts_family_id ON public.acts(family_id);
CREATE INDEX IF NOT EXISTS idx_acts_user_id ON public.acts(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_family_id ON public.feedback(family_id);
CREATE INDEX IF NOT EXISTS idx_notes_family_id ON public.notes(family_id);

-- ============================================
-- ROLLBACK
-- ============================================
-- To rollback this migration:
-- DROP INDEX IF EXISTS idx_notes_family_id;
-- DROP INDEX IF EXISTS idx_feedback_family_id;
-- DROP INDEX IF EXISTS idx_acts_user_id;
-- DROP INDEX IF EXISTS idx_acts_family_id;
-- DROP INDEX IF EXISTS idx_islamic_guidance_family_id;
-- DROP INDEX IF EXISTS idx_posts_created_at;
-- DROP INDEX IF EXISTS idx_posts_author_id;
-- DROP INDEX IF EXISTS idx_posts_family_id;
-- DROP INDEX IF EXISTS idx_events_event_date;
-- DROP INDEX IF EXISTS idx_events_family_id;
-- DROP INDEX IF EXISTS idx_profiles_family_id;