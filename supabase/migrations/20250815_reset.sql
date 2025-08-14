-- ==== DANGER: Reset PUBLIC app schema (backup BEFORE running) ====
-- Keeps Supabase system schemas intact (auth, storage, pgbouncer, extensions).

begin;

-- Extensions (idempotent)
create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

-- ---------- DROP PHASE (PUBLIC ONLY) ----------
drop table if exists public.event_attendees cascade;
drop table if exists public.events cascade;
drop table if exists public.chore_assignments cascade;
drop table if exists public.chores cascade;
drop table if exists public.likes cascade;
drop table if exists public.comments cascade;
drop table if exists public.posts cascade;
drop table if exists public.family_memberships cascade;
drop table if exists public.families cascade;
drop table if exists public.profiles cascade;

drop type if exists public.member_role;

-- ---------- RECREATE PHASE ----------
-- Types
create type public.member_role as enum ('admin','member');

-- Profiles (1:1 with auth.users)
create table public.profiles (
  user_id uuid primary key,
  email text unique not null,
  full_name text,
  role public.member_role not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add constraint profiles_user_fk
  foreign key (user_id) references auth.users(id)
  on delete cascade;

-- Families
create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

-- Family memberships
create table public.family_memberships (
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  role public.member_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (family_id, user_id)
);

-- Posts
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  author_id uuid not null references public.profiles(user_id) on delete cascade,
  content text not null,
  media_url text,
  created_at timestamptz not null default now()
);

-- Comments
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(user_id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

-- Likes
create table public.likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- Chores
create table public.chores (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  title text not null,
  notes text,
  points int not null default 0,
  due_date date,
  created_at timestamptz not null default now()
);

-- Chore assignments
create table public.chore_assignments (
  chore_id uuid not null references public.chores(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  status text not null default 'todo', -- 'todo' | 'doing' | 'done'
  updated_at timestamptz not null default now(),
  primary key (chore_id, user_id)
);

-- Events
create table public.events (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  creator_id uuid not null references public.profiles(user_id) on delete cascade,
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  all_day boolean not null default false,
  created_at timestamptz not null default now(),
  constraint events_time_check check (ends_at is null or ends_at >= starts_at)
);

-- Event attendees
create table public.event_attendees (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  rsvp text not null default 'yes', -- 'yes' | 'no' | 'maybe'
  updated_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

-- ---------- INDEXES ----------
create index if not exists idx_memberships_user on public.family_memberships(user_id);
create index if not exists idx_posts_family_created on public.posts(family_id, created_at desc);
create index if not exists idx_comments_post_created on public.comments(post_id, created_at desc);
create index if not exists idx_likes_user on public.likes(user_id);
create index if not exists idx_chores_family_due on public.chores(family_id, due_date);
create index if not exists idx_events_family_time on public.events(family_id, starts_at);

-- ---------- RLS HELPERS ----------
create or replace function public.is_admin() returns boolean
  language sql stable as $$
    select exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid() and p.role = 'admin'
    );
  $$;

create or replace function public.is_family_member(fid uuid) returns boolean
  language sql stable as $$
    select exists (
      select 1 from public.family_memberships m
      where m.family_id = fid and m.user_id = auth.uid()
    );
  $$;

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.families enable row level security;
alter table public.family_memberships enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.likes enable row level security;
alter table public.chores enable row level security;
alter table public.chore_assignments enable row level security;
alter table public.events enable row level security;
alter table public.event_attendees enable row level security;

-- Profiles
create policy "profiles_self_read" on public.profiles
  for select using (auth.uid() = user_id or public.is_admin());
create policy "profiles_self_update" on public.profiles
  for update using (auth.uid() = user_id or public.is_admin());
create policy "profiles_admin_insert" on public.profiles
  for insert to authenticated
  with check (public.is_admin());

-- Families
create policy "families_read_members" on public.families
  for select using (public.is_family_member(id) or public.is_admin());
create policy "families_write_admin" on public.families
  for all using (public.is_admin()) with check (public.is_admin());

-- Memberships
create policy "memberships_read_my_families" on public.family_memberships
  for select using (public.is_family_member(family_id) or public.is_admin());
create policy "memberships_write_admin" on public.family_memberships
  for all using (public.is_admin()) with check (public.is_admin());

-- Posts
create policy "posts_read_family" on public.posts
  for select using (public.is_family_member(family_id) or public.is_admin());
create policy "posts_insert_owner" on public.posts
  for insert with check ((auth.uid() = author_id) and public.is_family_member(family_id));
create policy "posts_update_owner_or_admin" on public.posts
  for update using ((auth.uid() = author_id) or public.is_admin());
create policy "posts_delete_owner_or_admin" on public.posts
  for delete using ((auth.uid() = author_id) or public.is_admin());

-- Comments
create policy "comments_read_family" on public.comments
  for select using (
    exists (select 1 from public.posts p where p.id = post_id and public.is_family_member(p.family_id))
    or public.is_admin()
  );
create policy "comments_insert_owner" on public.comments
  for insert with check (auth.uid() = author_id and exists (select 1 from public.posts p where p.id = post_id and public.is_family_member(p.family_id)));
create policy "comments_update_owner_or_admin" on public.comments
  for update using (auth.uid() = author_id or public.is_admin());
create policy "comments_delete_owner_or_admin" on public.comments
  for delete using (auth.uid() = author_id or public.is_admin());

-- Likes
create policy "likes_read_family" on public.likes
  for select using (
    exists (select 1 from public.posts p where p.id = post_id and public.is_family_member(p.family_id))
    or public.is_admin()
  );
create policy "likes_insert_owner" on public.likes
  for insert with check (auth.uid() = user_id and exists (select 1 from public.posts p where p.id = post_id and public.is_family_member(p.family_id)));
create policy "likes_delete_owner_or_admin" on public.likes
  for delete using (auth.uid() = user_id or public.is_admin());

-- Chores
create policy "chores_read_family" on public.chores
  for select using (public.is_family_member(family_id) or public.is_admin());
create policy "chores_write_admin" on public.chores
  for all using (public.is_admin()) with check (public.is_admin());

-- Chore assignments
create policy "chore_assign_read_family" on public.chore_assignments
  for select using (
    exists (select 1 from public.chores c where c.id = chore_id and public.is_family_member(c.family_id))
    or public.is_admin()
  );
create policy "chore_assign_update_self_or_admin" on public.chore_assignments
  for update using (auth.uid() = user_id or public.is_admin());
create policy "chore_assign_insert_admin" on public.chore_assignments
  for insert with check (public.is_admin());
create policy "chore_assign_delete_admin" on public.chore_assignments
  for delete using (public.is_admin());

commit;