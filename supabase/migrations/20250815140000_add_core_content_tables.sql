-- 20250815140000_add_core_content_tables.sql
-- Add missing core content tables that the application expects

-- Create core content tables that are missing from previous migrations
-- These should be created after families and profiles

-- Events table
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  title text NOT NULL,
  location text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  meta jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Posts table
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  body text NOT NULL,
  visibility text NOT NULL DEFAULT 'family', -- 'private' | 'family' | 'custom'
  audience jsonb,                            -- ids when custom
  created_at timestamptz DEFAULT now()
);

-- Acts table (activity log)
CREATE TABLE IF NOT EXISTS public.acts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  kind text NOT NULL,      -- 'gentle_action' | 'kindness' | 'goal_contrib' | ...
  points int DEFAULT 1,
  meta jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Notes table
CREATE TABLE IF NOT EXISTS public.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  body text,
  checklist jsonb,            -- [{text, done}]
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- EVENTS policies (idempotent)
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'events'
      and policyname = 'events: read family scope'
  ) then
    create policy "events: read family scope" on public.events
      for select using (
        family_id = (SELECT family_id FROM public.profiles WHERE user_id = auth.uid())
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'events'
      and policyname = 'events: owner write'
  ) then
    create policy "events: owner write" on public.events
      for all using (owner_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'events'
      and policyname = 'events: admin manage'
  ) then
    create policy "events: admin manage" on public.events
      for all using (
        EXISTS (
          SELECT 1 FROM public.profiles ap
          WHERE ap.user_id = auth.uid()
            AND ap.family_id = events.family_id
            AND ap.role = 'admin'
        )
      );
  end if;
end $$;

-- POSTS policies (idempotent)
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'posts'
      and policyname = 'posts: read family scope'
  ) then
    create policy "posts: read family scope" on public.posts
      for select using (
        family_id = (SELECT family_id FROM public.profiles WHERE user_id = auth.uid())
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'posts'
      and policyname = 'posts: author write'
  ) then
    create policy "posts: author write" on public.posts
      for all using (author_id = auth.uid());
  end if;
end $$;

-- ACTS policies (idempotent)
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'acts'
      and policyname = 'acts: read family scope'
  ) then
    create policy "acts: read family scope" on public.acts
      for select using (
        family_id = (SELECT family_id FROM public.profiles WHERE user_id = auth.uid())
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'acts'
      and policyname = 'acts: user write'
  ) then
    create policy "acts: user write" on public.acts
      for all using (user_id = auth.uid());
  end if;
end $$;

-- NOTES policies (idempotent)
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'notes'
      and policyname = 'notes: read family scope'
  ) then
    create policy "notes: read family scope" on public.notes
      for select using (
        family_id = (SELECT family_id FROM public.profiles WHERE user_id = auth.uid())
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'notes'
      and policyname = 'notes: author write'
  ) then
    create policy "notes: author write" on public.notes
      for all using (author_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'notes'
      and policyname = 'notes: admin manage'
  ) then
    create policy "notes: admin manage" on public.notes
      for all using (
        EXISTS (
          SELECT 1 FROM public.profiles ap
          WHERE ap.user_id = auth.uid()
            AND ap.family_id = notes.family_id
            AND ap.role = 'admin'
        )
      );
  end if;
end $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS events_family_idx ON public.events(family_id);
CREATE INDEX IF NOT EXISTS events_starts_at_idx ON public.events(starts_at);
CREATE INDEX IF NOT EXISTS posts_family_idx ON public.posts(family_id);
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON public.posts(created_at);
CREATE INDEX IF NOT EXISTS acts_family_user_idx ON public.acts(family_id, user_id);
CREATE INDEX IF NOT EXISTS acts_kind_idx ON public.acts(kind);
CREATE INDEX IF NOT EXISTS notes_family_idx ON public.notes(family_id);