-- ============================================
-- Supabase Schema Rollback - Complete Cleanup
-- Drops all objects created by schema_inferred.sql
-- ============================================

-- =========
-- DROP POLICIES (must be first)
-- =========

-- Drop all RLS policies
do $$
declare
  pol record;
begin
  for pol in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'families', 'profiles', 'events', 'posts', 'acts', 'feedback', 'notes',
        'preferences', 'wishlist', 'nudges', 'appreciations'
      )
  loop
    execute format('drop policy if exists %I on %I.%I cascade',
      pol.policyname, pol.schemaname, pol.tablename);
  end loop;
end$$;

-- =========
-- DROP VIEWS
-- =========

drop view if exists public.me cascade;

-- =========
-- DROP TRIGGERS
-- =========

drop trigger if exists trg_touch_updated_at_families on public.families;
drop trigger if exists trg_touch_updated_at_profiles on public.profiles;
drop trigger if exists trg_touch_updated_at_events on public.events;
drop trigger if exists trg_touch_updated_at_posts on public.posts;
drop trigger if exists trg_touch_updated_at_acts on public.acts;
drop trigger if exists trg_touch_updated_at_feedback on public.feedback;
drop trigger if exists trg_touch_updated_at_notes on public.notes;
drop trigger if exists trg_touch_updated_at_preferences on public.preferences;
drop trigger if exists trg_touch_updated_at_wishlist on public.wishlist;
drop trigger if exists trg_touch_updated_at_nudges on public.nudges;
drop trigger if exists trg_touch_updated_at_appreciations on public.appreciations;

-- =========
-- DROP FUNCTIONS
-- =========

drop function if exists public.touch_updated_at() cascade;

-- =========
-- DROP INDEXES
-- =========

-- Core table indexes
drop index if exists public.idx_profiles_family_id;
drop index if exists public.idx_events_family_id_starts_at;
drop index if exists public.idx_posts_family_id_created_at;
drop index if exists public.idx_acts_family_id_created_at;
drop index if exists public.idx_acts_user_id_kind;
drop index if exists public.idx_feedback_family_id_created_at;
drop index if exists public.idx_notes_family_id_updated_at;

-- FamilyBot table indexes
drop index if exists public.idx_preferences_family_id;
drop index if exists public.idx_wishlist_family_user;
drop index if exists public.idx_wishlist_completed;
drop index if exists public.idx_nudges_scheduled;
drop index if exists public.idx_nudges_family_target;
drop index if exists public.idx_appreciations_family;
drop index if exists public.idx_appreciations_to_user;

-- Additional indexes
drop index if exists public.idx_profiles_dob;
drop index if exists public.idx_events_owner_id;
drop index if exists public.idx_posts_author_id;
drop index if exists public.idx_acts_user_points;

-- =========
-- DROP TABLES (reverse dependency order)
-- =========

-- Drop child tables first (those with foreign keys)
drop table if exists public.appreciations cascade;
drop table if exists public.nudges cascade;
drop table if exists public.wishlist cascade;
drop table if exists public.preferences cascade;
drop table if exists public.notes cascade;
drop table if exists public.feedback cascade;
drop table if exists public.acts cascade;
drop table if exists public.posts cascade;
drop table if exists public.events cascade;
drop table if exists public.profiles cascade;
drop table if exists public.families cascade;

-- =========
-- DROP TYPES
-- =========

drop type if exists public.feedback_category cascade;
drop type if exists public.task_status cascade;
drop type if exists public.member_role cascade;

-- =========
-- DROP EXTENSIONS (optional - only if safe)
-- =========

-- Note: Extensions may be used by other objects, so we don't drop them
-- drop extension if exists "citext";
-- drop extension if exists "pgcrypto";