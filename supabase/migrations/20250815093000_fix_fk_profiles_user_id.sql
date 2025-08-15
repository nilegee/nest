-- Fix foreign keys that mistakenly point to profiles(id)
-- and (re)create proactive tables with correct references.

-- Safety: ensure profiles.user_id exists
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='profiles' and column_name='user_id'
  ) then
    raise exception 'profiles.user_id not found';
  end if;
end
$$;

-- Families table (if missing)
create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  created_at timestamptz default now()
);

-- PROACTIVE TABLES (correct FKs -> profiles(user_id))
create table if not exists public.preferences (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid references public.profiles(user_id) on delete cascade,
  key text not null,
  value jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (family_id, user_id, key)
);

create table if not exists public.nudges (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid references public.profiles(user_id) on delete set null,
  kind text not null,               -- e.g., 'birthday_soon' | 'event_tomorrow'
  payload jsonb default '{}'::jsonb,
  scheduled_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.appreciations (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  from_user uuid not null references public.profiles(user_id) on delete cascade,
  to_user uuid not null references public.profiles(user_id) on delete cascade,
  note text,
  created_at timestamptz default now()
);

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references public.families(id) on delete cascade,
  user_id uuid references public.profiles(user_id) on delete set null,
  topic text,
  details text,
  created_at timestamptz default now()
);

-- If your earlier migration already created any of these tables with a bad FK,
-- repair them in-place (no-op if constraint names don’t exist).
do $$
begin
  -- preferences.user_id
  if exists (select 1 from information_schema.table_constraints
             where table_name='preferences' and constraint_type='FOREIGN KEY') then
    begin
      alter table public.preferences drop constraint if exists preferences_user_id_fkey;
      alter table public.preferences
        add constraint preferences_user_id_fkey
        foreign key (user_id) references public.profiles(user_id) on delete cascade;
    exception when others then null; end;
  end if;

  -- nudges.user_id
  if exists (select 1 from information_schema.table_constraints
             where table_name='nudges' and constraint_type='FOREIGN KEY') then
    begin
      alter table public.nudges drop constraint if exists nudges_user_id_fkey;
      alter table public.nudges
        add constraint nudges_user_id_fkey
        foreign key (user_id) references public.profiles(user_id) on delete set null;
    exception when others then null; end;
  end if;

  -- appreciations.from_user / to_user
  if exists (select 1 from information_schema.table_constraints
             where table_name='appreciations' and constraint_type='FOREIGN KEY') then
    begin
      alter table public.appreciations drop constraint if exists appreciations_from_user_fkey;
      alter table public.appreciations drop constraint if exists appreciations_to_user_fkey;
      alter table public.appreciations
        add constraint appreciations_from_user_fkey
          foreign key (from_user) references public.profiles(user_id) on delete cascade,
        add constraint appreciations_to_user_fkey
          foreign key (to_user) references public.profiles(user_id) on delete cascade;
    exception when others then null; end;
  end if;
end
$$;
