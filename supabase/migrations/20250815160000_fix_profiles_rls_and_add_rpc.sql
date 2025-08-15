-- Fix RLS recursion on profiles, unify family access, and add RPC used by UI.
-- Safe for re-run: use IF EXISTS / IF NOT EXISTS and drop-create patterns.

begin;

-- 0) Safety: ensure extensions
create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

-- 1) Helper: current_user_id() and current_family_id() without RLS recursion
-- Use SECURITY DEFINER and a locked-down search_path so the function can read
-- profiles exactly once and return a scalar, avoiding recursive RLS evaluation.
create or replace function public.current_user_id()
returns uuid
language sql
stable
as $$ select auth.uid() $$;

revoke all on function public.current_user_id() from public;
grant execute on function public.current_user_id() to anon, authenticated, service_role;

create or replace function public.current_family_id()
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  fid uuid;
begin
  -- IMPORTANT: This single read bypasses RLS under SECURITY DEFINER, preventing recursion.
  select p.family_id into fid
  from public.profiles p
  where p.user_id = auth.uid();
  return fid;
end
$$;

-- Lock down who can run it
revoke all on function public.current_family_id() from public;
grant execute on function public.current_family_id() to anon, authenticated, service_role;

-- 2) RLS: PROFILES
alter table if exists public.profiles enable row level security;

-- Drop old recursive policies if they exist
do $$
begin
  if exists (select 1 from pg_policies where schemaname='public' and tablename='profiles') then
    -- Drop all to avoid name mismatch surprises
    execute (
      select string_agg(format('drop policy if exists %I on public.profiles;', polname), E'\n')
      from pg_policies
      where schemaname='public' and tablename='profiles'
    );
  end if;
end$$;

-- Minimal, non-recursive policies:
-- a) Everyone can read their family's profiles
create policy "profiles.select.family"
on public.profiles for select
using (family_id = public.current_family_id());

-- b) User can read/update their own row directly
create policy "profiles.select.self"
on public.profiles for select
using (user_id = auth.uid());

create policy "profiles.update.self"
on public.profiles for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- c) Insert: allow a user to create their profile row (first-time bootstrap)
create policy "profiles.insert.self"
on public.profiles for insert
with check (user_id = auth.uid());

-- 3) RLS: PREFERENCES (assumed schema: user_id owner, optionally family_id)
alter table if exists public.preferences enable row level security;

-- Clear existing policies
do $$
begin
  if exists (select 1 from pg_policies where schemaname='public' and tablename='preferences') then
    execute (
      select string_agg(format('drop policy if exists %I on public.preferences;', polname), E'\n')
      from pg_policies
      where schemaname='public' and tablename='preferences'
    );
  end if;
end$$;

-- Access rules
create policy "preferences.select.self_or_family"
on public.preferences for select
using (
  user_id = auth.uid()
  or (coalesce(family_id, public.current_family_id()) = public.current_family_id())
);

create policy "preferences.insert.self"
on public.preferences for insert
with check (
  user_id = auth.uid()
  or (coalesce(family_id, public.current_family_id()) = public.current_family_id())
);

create policy "preferences.update.self"
on public.preferences for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- 4) RLS: WISHLIST (assumed columns: user_id, family_id)
alter table if exists public.wishlist enable row level security;

do $$
begin
  if exists (select 1 from pg_policies where schemaname='public' and tablename='wishlist') then
    execute (
      select string_agg(format('drop policy if exists %I on public.wishlist;', polname), E'\n')
      from pg_policies
      where schemaname='public' and tablename='wishlist'
    );
  end if;
end$$;

create policy "wishlist.select.self_or_family"
on public.wishlist for select
using (
  user_id = auth.uid()
  or family_id = public.current_family_id()
);

create policy "wishlist.cud.self_or_family"
on public.wishlist for all
using (
  user_id = auth.uid()
  or family_id = public.current_family_id()
)
with check (
  user_id = auth.uid()
  or family_id = public.current_family_id()
);

-- 5) RLS: NUDGES (assumed: family_id, target_user_id, sent_at, scheduled_for)
alter table if exists public.nudges enable row level security;

do $$
begin
  if exists (select 1 from pg_policies where schemaname='public' and tablename='nudges') then
    execute (
      select string_agg(format('drop policy if exists %I on public.nudges;', polname), E'\n')
      from pg_policies
      where schemaname='public' and tablename='nudges'
    );
  end if;
end$$;

create policy "nudges.select.family"
on public.nudges for select
using (family_id = public.current_family_id());

create policy "nudges.cud.family"
on public.nudges for all
using (family_id = public.current_family_id())
with check (family_id = public.current_family_id());

-- 6) Missing RPC used by UI: ensure_family_for_user()
-- Creates a family for the current user if none set; ensures a profile row exists.
create or replace function public.ensure_family_for_user()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  prof record;
  fam_id uuid;
  fam_name text;
begin
  if uid is null then
    raise exception 'requires authenticated user';
  end if;

  -- Ensure profile row exists
  select * into prof from public.profiles where user_id = uid;
  if not found then
    insert into public.profiles (user_id, full_name)
    values (uid, coalesce(nullif((auth.jwt()->>'email')::text,''),'Member'))
    returning * into prof;
  end if;

  -- If no family, create one and attach
  if prof.family_id is null then
    fam_name := coalesce(split_part(auth.jwt()->>'email','@',1),'Family') || ' Family';
    insert into public.families(name)
    values (fam_name)
    returning id into fam_id;

    update public.profiles
    set family_id = fam_id
    where user_id = uid;
  end if;
end;
$$;

revoke all on function public.ensure_family_for_user() from public;
grant execute on function public.ensure_family_for_user() to anon, authenticated, service_role;

-- 7) Quick verification queries (no-op if RLS blocks wrongly)
-- NOTE: Do not rely on output here; this just ensures the SQL compiles.
-- select public.current_family_id();

commit;