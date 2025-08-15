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

-- Keep feedback table (not part of FamilyBot)
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references public.families(id) on delete cascade,
  user_id uuid references public.profiles(user_id) on delete set null,
  topic text,
  details text,
  created_at timestamptz default now()
);


-- Note: preferences, nudges, appreciations are now handled by FamilyBot migration
-- so no FK fixes needed here
