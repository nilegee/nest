-- ============================================
-- Supabase Schema - Complete Inferred Schema
-- Generated from codebase analysis
-- ============================================

-- Required extensions
create extension if not exists "pgcrypto";    -- for gen_random_uuid()
create extension if not exists "citext";      -- for case-insensitive uniques

-- =========
-- ENUMS
-- =========

-- Member roles within families
do $$ begin
  create type public.member_role as enum ('admin','member');
exception when duplicate_object then null; end $$;

-- Task/goal status enumeration
do $$ begin
  create type public.task_status as enum ('todo','in_progress','done');
exception when duplicate_object then null; end $$;

-- Feedback/insight categories
do $$ begin
  create type public.feedback_category as enum ('mood','behavior','appreciation','concern');
exception when duplicate_object then null; end $$;

-- =========
-- CORE TABLES
-- =========

-- Family organization (multi-tenant root)
create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null, -- will be FK to auth.users but kept flexible
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- User profiles (1:1 with auth.users)
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  dob date,
  avatar_url text,
  role public.member_role not null default 'member',
  family_id uuid not null references public.families(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========
-- CONTENT TABLES
-- =========

-- Family events and calendar items
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  owner_id uuid not null references public.profiles(user_id) on delete cascade,
  title text not null,
  location text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  meta jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Family posts and announcements
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  author_id uuid not null references public.profiles(user_id) on delete cascade,
  body text not null,
  visibility text not null default 'family' check (visibility in ('private','family','custom')),
  audience jsonb, -- array of user_ids when visibility='custom'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Activity tracking (achievements, kindness, etc.)
create table if not exists public.acts (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  kind text not null, -- 'gentle_action', 'kindness', 'goal_contrib', 'chore_complete'
  points integer not null default 1 check (points >= 0),
  meta jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Feedback and insights about family members
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  about_id uuid not null references public.profiles(user_id) on delete cascade,
  by_id uuid not null references public.profiles(user_id) on delete cascade,
  answers jsonb not null, -- aggregated MCQ/mood data
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Notes and journaling
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  author_id uuid not null references public.profiles(user_id) on delete cascade,
  body text,
  checklist jsonb, -- array of {text, done} objects
  meta jsonb not null default '{}', -- template info, etc.
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========
-- FAMILYBOT TABLES
-- =========

-- User preferences for FamilyBot configuration
create table if not exists public.preferences (
  user_id uuid primary key references public.profiles(user_id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  bot_name text not null default 'FamilyBot',
  theme text not null default 'classic' check (theme in ('classic','roblox-lite','minecraft-lite','pubg-lite','sims-lite')),
  language text not null default 'en' check (language in ('en','ar','mix')),
  message_pack text not null default 'standard' check (message_pack in ('standard','arabic_values')),
  role_tag text check (role_tag in ('mom','dad','child')),
  interests jsonb not null default '[]',
  gaming_minutes_goal integer not null default 120 check (gaming_minutes_goal > 0),
  quiet_hours_start time not null default '22:00',
  quiet_hours_end time not null default '08:00',
  nudge_cap_per_day integer not null default 3 check (nudge_cap_per_day >= 0),
  muted_categories jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Family member wishlists
create table if not exists public.wishlist (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  title text not null,
  description text,
  priority integer not null default 1 check (priority between 1 and 5),
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Scheduled nudges/messages from FamilyBot
create table if not exists public.nudges (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  target_user_id uuid not null references public.profiles(user_id) on delete cascade,
  nudge_kind text not null,
  message text not null,
  scheduled_for timestamptz not null,
  sent_at timestamptz,
  responded_at timestamptz,
  response_data jsonb,
  meta jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Appreciation/gratitude system
create table if not exists public.appreciations (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  from_user_id uuid not null references public.profiles(user_id) on delete cascade,
  to_user_id uuid references public.profiles(user_id) on delete cascade,
  appreciation_text text not null,
  occasion text, -- 'birthday', 'monthly_gratitude', 'kindness_response', etc
  posted_to_feed boolean not null default false,
  posted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========
-- FOREIGN KEY CONSTRAINTS
-- =========

-- All FK constraints are defined inline above

-- =========
-- INDEXES
-- =========

-- Family-scoped queries (most common pattern)
create index if not exists idx_profiles_family_id on public.profiles(family_id);
create index if not exists idx_events_family_id_starts_at on public.events(family_id, starts_at desc);
create index if not exists idx_posts_family_id_created_at on public.posts(family_id, created_at desc);
create index if not exists idx_acts_family_id_created_at on public.acts(family_id, created_at desc);
create index if not exists idx_acts_user_id_kind on public.acts(user_id, kind);
create index if not exists idx_feedback_family_id_created_at on public.feedback(family_id, created_at desc);
create index if not exists idx_notes_family_id_updated_at on public.notes(family_id, updated_at desc);

-- FamilyBot specific indexes
create index if not exists idx_preferences_family_id on public.preferences(family_id);
create index if not exists idx_wishlist_family_user on public.wishlist(family_id, user_id);
create index if not exists idx_wishlist_completed on public.wishlist(family_id, completed, created_at desc);
create index if not exists idx_nudges_scheduled on public.nudges(scheduled_for) where sent_at is null;
create index if not exists idx_nudges_family_target on public.nudges(family_id, target_user_id);
create index if not exists idx_appreciations_family on public.appreciations(family_id, created_at desc);
create index if not exists idx_appreciations_to_user on public.appreciations(to_user_id, created_at desc);

-- User and date-based lookups
create index if not exists idx_profiles_dob on public.profiles(dob) where dob is not null;
create index if not exists idx_events_owner_id on public.events(owner_id);
create index if not exists idx_posts_author_id on public.posts(author_id);
create index if not exists idx_acts_user_points on public.acts(user_id, points desc, created_at desc);

-- =========
-- TRIGGERS
-- =========

-- Function to automatically update updated_at timestamp
create or replace function public.touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply updated_at trigger to all tables with updated_at column
do $$ begin
  perform 1 from pg_trigger where tgname = 'trg_touch_updated_at_families';
  if not found then
    create trigger trg_touch_updated_at_families before update on public.families
    for each row execute function public.touch_updated_at();
  end if;
end $$;

do $$ begin
  perform 1 from pg_trigger where tgname = 'trg_touch_updated_at_profiles';
  if not found then
    create trigger trg_touch_updated_at_profiles before update on public.profiles
    for each row execute function public.touch_updated_at();
  end if;
end $$;

do $$ begin
  perform 1 from pg_trigger where tgname = 'trg_touch_updated_at_events';
  if not found then
    create trigger trg_touch_updated_at_events before update on public.events
    for each row execute function public.touch_updated_at();
  end if;
end $$;

do $$ begin
  perform 1 from pg_trigger where tgname = 'trg_touch_updated_at_posts';
  if not found then
    create trigger trg_touch_updated_at_posts before update on public.posts
    for each row execute function public.touch_updated_at();
  end if;
end $$;

do $$ begin
  perform 1 from pg_trigger where tgname = 'trg_touch_updated_at_acts';
  if not found then
    create trigger trg_touch_updated_at_acts before update on public.acts
    for each row execute function public.touch_updated_at();
  end if;
end $$;

do $$ begin
  perform 1 from pg_trigger where tgname = 'trg_touch_updated_at_feedback';
  if not found then
    create trigger trg_touch_updated_at_feedback before update on public.feedback
    for each row execute function public.touch_updated_at();
  end if;
end $$;

do $$ begin
  perform 1 from pg_trigger where tgname = 'trg_touch_updated_at_notes';
  if not found then
    create trigger trg_touch_updated_at_notes before update on public.notes
    for each row execute function public.touch_updated_at();
  end if;
end $$;

do $$ begin
  perform 1 from pg_trigger where tgname = 'trg_touch_updated_at_preferences';
  if not found then
    create trigger trg_touch_updated_at_preferences before update on public.preferences
    for each row execute function public.touch_updated_at();
  end if;
end $$;

do $$ begin
  perform 1 from pg_trigger where tgname = 'trg_touch_updated_at_wishlist';
  if not found then
    create trigger trg_touch_updated_at_wishlist before update on public.wishlist
    for each row execute function public.touch_updated_at();
  end if;
end $$;

do $$ begin
  perform 1 from pg_trigger where tgname = 'trg_touch_updated_at_nudges';
  if not found then
    create trigger trg_touch_updated_at_nudges before update on public.nudges
    for each row execute function public.touch_updated_at();
  end if;
end $$;

do $$ begin
  perform 1 from pg_trigger where tgname = 'trg_touch_updated_at_appreciations';
  if not found then
    create trigger trg_touch_updated_at_appreciations before update on public.appreciations
    for each row execute function public.touch_updated_at();
  end if;
end $$;

-- =========
-- VIEWS
-- =========

-- Helper view: current user's profile
create or replace view public.me as
select p.* from public.profiles p
where p.user_id = auth.uid();

-- =========
-- ROW LEVEL SECURITY (RLS)
-- =========

-- Enable RLS on all tables
alter table public.families enable row level security;
alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.posts enable row level security;
alter table public.acts enable row level security;
alter table public.feedback enable row level security;
alter table public.notes enable row level security;
alter table public.preferences enable row level security;
alter table public.wishlist enable row level security;
alter table public.nudges enable row level security;
alter table public.appreciations enable row level security;

-- =========
-- RLS POLICIES
-- =========

-- FAMILIES: Users can only see their own family
create policy if not exists "select families I belong to"
  on public.families for select
  using ( exists (
    select 1 from public.profiles p
    where p.family_id = families.id and p.user_id = auth.uid()
  ));

-- PROFILES: Users can see family members and update themselves
create policy if not exists "select profiles in my family"
  on public.profiles for select
  using (family_id = (select family_id from public.profiles where user_id = auth.uid()));

create policy if not exists "update my own profile"
  on public.profiles for update
  using (user_id = auth.uid());

create policy if not exists "admin can update family profiles"
  on public.profiles for update
  using ( exists (
    select 1 from public.profiles ap
    where ap.user_id = auth.uid()
      and ap.family_id = profiles.family_id
      and ap.role = 'admin'
  ));

-- EVENTS: Family members can see and manage events
create policy if not exists "select events in my family"
  on public.events for select
  using (family_id = (select family_id from public.profiles where user_id = auth.uid()));

create policy if not exists "insert events as family member"
  on public.events for insert
  with check (family_id = (select family_id from public.profiles where user_id = auth.uid()));

create policy if not exists "update my events"
  on public.events for update
  using (owner_id = auth.uid());

create policy if not exists "delete my events"
  on public.events for delete
  using (owner_id = auth.uid());

-- POSTS: Family members can see and manage posts
create policy if not exists "select posts in my family"
  on public.posts for select
  using (family_id = (select family_id from public.profiles where user_id = auth.uid()));

create policy if not exists "insert posts as family member"
  on public.posts for insert
  with check (family_id = (select family_id from public.profiles where user_id = auth.uid()));

create policy if not exists "update my posts"
  on public.posts for update
  using (author_id = auth.uid());

create policy if not exists "delete my posts"
  on public.posts for delete
  using (author_id = auth.uid());

-- ACTS: Users can see family acts and manage their own
create policy if not exists "select acts in my family"
  on public.acts for select
  using (family_id = (select family_id from public.profiles where user_id = auth.uid()));

create policy if not exists "insert my acts"
  on public.acts for insert
  with check (user_id = auth.uid());

create policy if not exists "update my acts"
  on public.acts for update
  using (user_id = auth.uid());

create policy if not exists "delete my acts"
  on public.acts for delete
  using (user_id = auth.uid());

-- FEEDBACK: Family members can see family feedback, give feedback
create policy if not exists "select feedback in my family"
  on public.feedback for select
  using (family_id = (select family_id from public.profiles where user_id = auth.uid()));

create policy if not exists "insert feedback as family member"
  on public.feedback for insert
  with check (by_id = auth.uid());

create policy if not exists "admin can delete feedback"
  on public.feedback for delete
  using ( exists (
    select 1 from public.profiles ap
    where ap.user_id = auth.uid()
      and ap.family_id = feedback.family_id
      and ap.role = 'admin'
  ));

-- NOTES: Family members can see and manage their own notes
create policy if not exists "select notes in my family"
  on public.notes for select
  using (family_id = (select family_id from public.profiles where user_id = auth.uid()));

create policy if not exists "manage my notes"
  on public.notes for all
  using (author_id = auth.uid());

-- PREFERENCES: Users can only see and manage their own preferences
create policy if not exists "select my preferences"
  on public.preferences for select
  using (user_id = auth.uid());

create policy if not exists "manage my preferences"
  on public.preferences for all
  using (user_id = auth.uid());

-- WISHLIST: Family members can see wishlists, users manage their own
create policy if not exists "select wishlist in my family"
  on public.wishlist for select
  using (family_id = (select family_id from public.profiles where user_id = auth.uid()));

create policy if not exists "manage my wishlist"
  on public.wishlist for all
  using (user_id = auth.uid());

-- NUDGES: Family members can see nudges, target users can respond
create policy if not exists "select nudges in my family"
  on public.nudges for select
  using (family_id = (select family_id from public.profiles where user_id = auth.uid()));

create policy if not exists "insert nudges as family member"
  on public.nudges for insert
  with check (family_id = (select family_id from public.profiles where user_id = auth.uid()));

create policy if not exists "target can respond to nudges"
  on public.nudges for update
  using (target_user_id = auth.uid());

-- APPRECIATIONS: Family members can see and create appreciations
create policy if not exists "select appreciations in my family"
  on public.appreciations for select
  using (family_id = (select family_id from public.profiles where user_id = auth.uid()));

create policy if not exists "create appreciations as family member"
  on public.appreciations for insert
  with check (from_user_id = auth.uid());

create policy if not exists "update my appreciations"
  on public.appreciations for update
  using (from_user_id = auth.uid());

create policy if not exists "delete my appreciations"
  on public.appreciations for delete
  using (from_user_id = auth.uid());