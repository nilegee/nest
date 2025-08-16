-- ============================================
-- WARNING: This will delete ALL current tables,
--          data, views, types, and policies!
-- ============================================

-- 1. Drop policies
do $$
declare
  pol record;
begin
  for pol in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
  loop
    execute format('drop policy if exists %I on %I.%I cascade',
      pol.policyname, pol.schemaname, pol.tablename);
  end loop;
end$$;

-- 2. Drop views
drop view if exists public.me cascade;

-- 3. Drop tables (children first)
drop table if exists public.notes cascade;
drop table if exists public.feedback cascade;
drop table if exists public.acts cascade;
drop table if exists public.posts cascade;
drop table if exists public.events cascade;
drop table if exists public.profiles cascade;
drop table if exists public.families cascade;

-- 4. Drop custom types
drop type if exists public.member_role cascade;

-- =========
-- CORE TYPES
-- =========
create type public.member_role as enum ('admin','member');

-- =========
-- FAMILIES & MEMBERSHIP
-- =========
create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- each Supabase auth user is a profile (1:1)
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  dob date,
  avatar_url text,
  role public.member_role not null default 'member',
  family_id uuid not null references public.families(id) on delete cascade,
  created_at timestamptz default now()
);

-- =========
-- CONTENT TABLES (minimal for current UI)
-- =========
create table public.events (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  owner_id uuid not null references public.profiles(user_id) on delete cascade,
  title text not null,
  event_date date not null default current_date,
  type text check (type in ('birthday','anniversary','custom')) default 'custom',
  location text,
  starts_at timestamptz,
  ends_at timestamptz,
  meta jsonb default '{}',
  created_at timestamptz default now(),
  description text,
  is_recurring boolean default false,
  recurrence_pattern jsonb,
  notification_settings jsonb default '{"email": true, "push": false}',
  attendees jsonb default '[]',
  updated_at timestamptz default now()
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  author_id uuid not null references public.profiles(user_id) on delete cascade,
  body text not null,
  visibility text not null default 'family', -- 'private' | 'family' | 'custom'
  audience jsonb,                            -- ids when custom
  created_at timestamptz default now()
);

create table public.acts (
  -- generic activity log (e.g., gentle action complete, kindness, etc.)
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  kind text not null,      -- 'gentle_action' | 'kindness' | 'goal_contrib' | ...
  points int default 1,
  meta jsonb default '{}',
  created_at timestamptz default now()
);

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  about_id uuid not null references public.profiles(user_id) on delete cascade,
  by_id uuid not null references public.profiles(user_id) on delete cascade,
  answers jsonb not null,      -- aggregated MCQ/mood for a round
  created_at timestamptz default now()
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  author_id uuid not null references public.profiles(user_id) on delete cascade,
  body text,
  checklist jsonb,            -- [{text, done}]
  updated_at timestamptz default now()
);

-- =========
-- SECURITY: RLS
-- =========
alter table public.families     enable row level security;
alter table public.profiles     enable row level security;
alter table public.events       enable row level security;
alter table public.posts        enable row level security;
alter table public.acts         enable row level security;
alter table public.feedback     enable row level security;
alter table public.notes        enable row level security;

-- Helper: current user's profile row
create or replace view public.me as
select p.* from public.profiles p
where p.user_id = auth.uid();

-- Policy: profiles
create policy "profiles: read same family"
on public.profiles for select
using (family_id = (select family_id from public.profiles where user_id = auth.uid()));

create policy "profiles: user can update self"
on public.profiles for update
using (user_id = auth.uid());

create policy "profiles: admin can update family members"
on public.profiles for update
using (
  exists (
    select 1 from public.profiles ap
    where ap.user_id = auth.uid()
      and ap.family_id = profiles.family_id
      and ap.role = 'admin'
  )
);

-- Policy: families (read only own family)
create policy "families: read my family"
on public.families for select
using (
  id = (select family_id from public.profiles where user_id = auth.uid())
);

-- READ: anyone in family can read family-scoped rows (posts obey visibility in app logic)
create policy "family tables: read family scope"
on public.events for select
using (family_id = (select family_id from public.profiles where user_id = auth.uid()));
create policy "family tables: read family scope posts"
on public.posts for select
using (family_id = (select family_id from public.profiles where user_id = auth.uid()));
create policy "family tables: read family scope acts"
on public.acts for select
using (family_id = (select family_id from public.profiles where user_id = auth.uid()));
create policy "family tables: read family scope feedback"
on public.feedback for select
using (family_id = (select family_id from public.profiles where user_id = auth.uid()));
create policy "family tables: read family scope notes"
on public.notes for select
using (family_id = (select family_id from public.profiles where user_id = auth.uid()));

-- WRITE: owners can insert/update/delete their own rows
create policy "events: owner write"
on public.events for all
using (owner_id = auth.uid());

create policy "posts: author write"
on public.posts for all
using (author_id = auth.uid());

create policy "acts: user write"
on public.acts for all
using (user_id = auth.uid());

create policy "feedback: writer write"
on public.feedback for insert
with check (by_id = auth.uid());
create policy "feedback: admin redact/delete"
on public.feedback for delete
using (
  exists (
    select 1 from public.profiles ap
    where ap.user_id = auth.uid()
      and ap.family_id = feedback.family_id
      and ap.role = 'admin'
  )
);

create policy "notes: author write"
on public.notes for all
using (author_id = auth.uid());

-- Admins may manage events/notes for the family
create policy "events: admin manage"
on public.events for all
using (
  exists (
    select 1 from public.profiles ap
    where ap.user_id = auth.uid()
      and ap.family_id = events.family_id
      and ap.role = 'admin'
  )
);

create policy "notes: admin manage"
on public.notes for all
using (
  exists (
    select 1 from public.profiles ap
    where ap.user_id = auth.uid()
      and ap.family_id = notes.family_id
      and ap.role = 'admin'
  )
);

-- =========
-- SEED (KEEP COMMENTED; fill real auth.users UUIDs manually after reset)
-- select id, email from auth.users where email in ('abdessamia.mariem@gmail.com','nilezat@gmail.com','yazidgeemail@gmail.com','yahyageemail@gmail.com');
-- insert into public.families (id, name) values (gen_random_uuid(), 'Our Family') returning id;
-- insert into public.profiles (user_id, full_name, dob, role, family_id) values ('<UUID_OF_MARIEM>', 'Mariem', '1990-01-30', 'admin', '<family_id>');
-- insert into public.profiles (user_id, full_name, dob, role, family_id) values ('<UUID_OF_GHASSAN>', 'Ghassan', '1981-08-31', 'admin', '<family_id>');
-- insert into public.profiles (user_id, full_name, dob, role, family_id) values ('<UUID_OF_YAZID>', 'Yazid', '2014-03-28', 'member', '<family_id>');
-- insert into public.profiles (user_id, full_name, dob, role, family_id) values ('<UUID_OF_YAHYA>', 'Yahya', '2017-10-23', 'member', '<family_id>');