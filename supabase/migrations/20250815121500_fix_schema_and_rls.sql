-- Align schema with frontend (profiles.dob, me view, family‑scoped RLS)

-- PROFILES
create table if not exists public.profiles(
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  family_id uuid,
  avatar_url text,
  dob date,
  created_at timestamptz default now()
);

do $$ begin
  if not exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='profiles' and column_name='dob') then
    alter table public.profiles add column dob date;
  end if;
end $$;

-- SUPPORTING TABLES (minimal, only if missing)
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

create type if not exists act_kind as enum ('chore_complete','goal_progress','post','habit');

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

-- RLS
alter table public.profiles   enable row level security;
alter table public.preferences enable row level security;
alter table public.wishlist   enable row level security;
alter table public.acts       enable row level security;
alter table public.notes      enable row level security;
alter table public.nudges     enable row level security;

-- profiles policies
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
    for all using (user_id=auth.uid()) with check (user_id=auth.uid());
  end if;
end $$;

-- notes policies
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
    for update using (author_id=auth.uid());
  end if;
end $$;

-- wishlist policies
do $$ begin
  if not exists (select 1 from pg_policies where tablename='wishlist' and policyname='wishlist owner select') then
    create policy "wishlist owner select" on public.wishlist
    for select using (user_id=auth.uid());
  end if;
  if not exists (select 1 from pg_policies where tablename='wishlist' and policyname='wishlist owner crud') then
    create policy "wishlist owner crud" on public.wishlist
    for all using (user_id=auth.uid()) with check (user_id=auth.uid());
  end if;
end $$;

-- acts policies
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

-- nudges policies
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

-- /rest/v1/me view
create or replace view public.me as
select p.user_id, p.full_name, p.family_id, p.dob, p.avatar_url
from public.profiles p where p.user_id = auth.uid();

grant select on public.me to anon, authenticated;

-- ensure profile row on new auth user
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
    after insert on auth.users for each row execute function public.ensure_profile_for_new_user();
  end if;
end $$;