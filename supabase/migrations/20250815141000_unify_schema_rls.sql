-- Align frontend expectations; make safe for repeated runs.

-- PROFILES + columns expected by UI (dob)
create table if not exists public.profiles(
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  family_id uuid,
  avatar_url text,
  dob date,
  created_at timestamptz default now()
);
do $$ begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='dob') then
    alter table public.profiles add column dob date;
  end if;
end $$;

-- SUPPORTING TABLES (create if missing)
create table if not exists public.families(
  id uuid primary key default gen_random_uuid(),
  name text unique,
  created_at timestamptz default now()
);

create table if not exists public.preferences(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  data jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.wishlist(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  title text not null,
  priority int default 0,
  created_at timestamptz default now()
);

-- Idempotent enum creation / extension
do $$
begin
  -- Create the enum if it doesn't exist
  if not exists (
    select 1 from pg_type t where t.typname = 'act_kind'
  ) then
    create type act_kind as enum ('chore_complete','goal_progress','post','habit');
  else
    -- Ensure every label exists (no-op if already present)
    if not exists (
      select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid
      where t.typname = 'act_kind' and e.enumlabel = 'chore_complete'
    ) then
      alter type act_kind add value 'chore_complete';
    end if;

    if not exists (
      select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid
      where t.typname = 'act_kind' and e.enumlabel = 'goal_progress'
    ) then
      alter type act_kind add value 'goal_progress';
    end if;

    if not exists (
      select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid
      where t.typname = 'act_kind' and e.enumlabel = 'post'
    ) then
      alter type act_kind add value 'post';
    end if;

    if not exists (
      select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid
      where t.typname = 'act_kind' and e.enumlabel = 'habit'
    ) then
      alter type act_kind add value 'habit';
    end if;
  end if;
end
$$;

create table if not exists public.acts(
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null,
  assignee_id uuid references public.profiles(user_id),
  kind act_kind not null,
  qty int default 1,
  data jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.notes(
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(user_id) on delete cascade,
  family_id uuid,
  content text,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists public.nudges(
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null,
  target_user_id uuid references public.profiles(user_id),
  message text not null,
  scheduled_for timestamptz,
  sent_at timestamptz,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.profiles    enable row level security;
alter table public.preferences enable row level security;
alter table public.wishlist    enable row level security;
alter table public.acts        enable row level security;
alter table public.notes       enable row level security;
alter table public.nudges      enable row level security;

-- PROFILES policies
do $$ begin
  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='profiles self or family read') then
    create policy "profiles self or family read" on public.profiles
      for select using (
        user_id = auth.uid() or exists (
          select 1 from public.profiles me where me.user_id=auth.uid() and me.family_id=profiles.family_id
        )
      );
  end if;
  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='profiles self upsert') then
    create policy "profiles self upsert" on public.profiles
      for all using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
end $$;

-- NOTES policies
do $$ begin
  if not exists (select 1 from pg_policies where tablename='notes' and policyname='notes family select') then
    create policy "notes family select" on public.notes
      for select using (
        exists (select 1 from public.profiles me where me.user_id=auth.uid() and me.family_id=notes.family_id)
      );
  end if;
  if not exists (select 1 from pg_policies where tablename='notes' and policyname='notes family insert') then
    create policy "notes family insert" on public.notes
      for insert with check (
        exists (select 1 from public.profiles me where me.user_id=auth.uid() and (notes.family_id is null or me.family_id=notes.family_id))
      );
  end if;
  if not exists (select 1 from pg_policies where tablename='notes' and policyname='notes author update') then
    create policy "notes author update" on public.notes
      for update using (author_id = auth.uid());
  end if;
end $$;

-- WISHLIST
do $$ begin
  if not exists (select 1 from pg_policies where tablename='wishlist' and policyname='wishlist owner select') then
    create policy "wishlist owner select" on public.wishlist
      for select using (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where tablename='wishlist' and policyname='wishlist owner crud') then
    create policy "wishlist owner crud" on public.wishlist
      for all using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
end $$;

-- ACTS (family scoped)
do $$ begin
  if not exists (select 1 from pg_policies where tablename='acts' and policyname='acts family read') then
    create policy "acts family read" on public.acts
      for select using (
        exists (select 1 from public.profiles me where me.user_id=auth.uid() and me.family_id=acts.family_id)
      );
  end if;
  if not exists (select 1 from pg_policies where tablename='acts' and policyname='acts family insert') then
    create policy "acts family insert" on public.acts
      for insert with check (
        exists (select 1 from public.profiles me where me.user_id=auth.uid() and me.family_id=acts.family_id)
      );
  end if;
end $$;

-- NUDGES (family scoped)
do $$ begin
  if not exists (select 1 from pg_policies where tablename='nudges' and policyname='nudges family read') then
    create policy "nudges family read" on public.nudges
      for select using (
        exists (select 1 from public.profiles me where me.user_id=auth.uid() and me.family_id=nudges.family_id)
      );
  end if;
  if not exists (select 1 from pg_policies where tablename='nudges' and policyname='nudges family insert') then
    create policy "nudges family insert" on public.nudges
      for insert with check (
        exists (select 1 from public.profiles me where me.user_id=auth.uid() and me.family_id=nudges.family_id)
      );
  end if;
end $$;

-- /rest/v1/me view (idempotent)
-- Drop the old shape if present (safe to run repeatedly)
drop view if exists public.me;

-- Recreate with the canonical columns used by the app
create view public.me as
select
  p.user_id,
  p.full_name,
  p.family_id,
  p.dob,
  p.avatar_url
from public.profiles p
where p.user_id = auth.uid();

-- Re-grant after recreate
grant select on public.me to anon, authenticated;

-- Ensure profile row for new auth users
create or replace function public.ensure_profile_for_new_user()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(user_id, full_name, family_id)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)), null)
  on conflict (user_id) do nothing;
  return new;
end; $$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname='on_auth_user_created') then
    create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.ensure_profile_for_new_user();
  end if;
end $$;