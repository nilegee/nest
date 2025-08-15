-- 20250815130000_add_familybot_tables.sql
-- Add FamilyBot tables with correct schema (idempotent)

-- User preferences for FamilyBot configuration (idempotent)

-- 1) Ensure the table exists with a minimal shape
create table if not exists public.preferences (
  user_id uuid primary key references public.profiles(user_id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  created_at timestamptz default now()
);

-- 2) Add columns that might be missing from older minimal versions
do $$ begin
  if not exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='preferences' and column_name='bot_name') then
    alter table public.preferences add column bot_name text default 'FamilyBot';
  end if;

  if not exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='preferences' and column_name='theme') then
    alter table public.preferences add column theme text default 'classic' check (theme in ('classic','roblox-lite','minecraft-lite','pubg-lite','sims-lite'));
  end if;

  if not exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='preferences' and column_name='language') then
    alter table public.preferences add column language text default 'en' check (language in ('en','ar','mix'));
  end if;

  if not exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='preferences' and column_name='message_pack') then
    alter table public.preferences add column message_pack text default 'standard' check (message_pack in ('standard','arabic_values'));
  end if;

  if not exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='preferences' and column_name='role_tag') then
    alter table public.preferences add column role_tag text check (role_tag in ('mom','dad','child'));
  end if;

  if not exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='preferences' and column_name='interests') then
    alter table public.preferences add column interests jsonb default '[]';
  end if;

  if not exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='preferences' and column_name='gaming_minutes_goal') then
    alter table public.preferences add column gaming_minutes_goal integer default 120;
  end if;

  if not exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='preferences' and column_name='quiet_hours_start') then
    alter table public.preferences add column quiet_hours_start time default '22:00';
  end if;

  if not exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='preferences' and column_name='quiet_hours_end') then
    alter table public.preferences add column quiet_hours_end time default '08:00';
  end if;

  if not exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='preferences' and column_name='nudge_cap_per_day') then
    alter table public.preferences add column nudge_cap_per_day integer default 3;
  end if;

  if not exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='preferences' and column_name='muted_categories') then
    alter table public.preferences add column muted_categories jsonb default '[]';
  end if;

  if not exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='preferences' and column_name='updated_at') then
    alter table public.preferences add column updated_at timestamptz default now();
  end if;
end $$;

-- Family member wishlists (idempotent)

-- 1) Ensure the table exists with a minimal shape
create table if not exists public.wishlist (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  title text not null,
  priority integer default 1 check (priority between 1 and 5),
  created_at timestamptz default now()
);

-- 2) Add columns that might be missing from older minimal versions
do $$ begin
  if not exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='wishlist' and column_name='description') then
    alter table public.wishlist add column description text;
  end if;

  if not exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='wishlist' and column_name='completed') then
    alter table public.wishlist add column completed boolean default false;
  end if;

  if not exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='wishlist' and column_name='completed_at') then
    alter table public.wishlist add column completed_at timestamptz;
  end if;

  if not exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='wishlist' and column_name='updated_at') then
    alter table public.wishlist add column updated_at timestamptz default now();
  end if;
end $$;

-- Appreciation/gratitude system (idempotent)

-- 1) Ensure the table exists with a minimal shape
create table if not exists public.appreciations (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  from_user_id uuid not null references public.profiles(user_id) on delete cascade,
  appreciation_text text not null,
  created_at timestamptz default now()
);

-- 2) Add columns that might be missing from older minimal versions
do $$ begin
  if not exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='appreciations' and column_name='to_user_id') then
    alter table public.appreciations add column to_user_id uuid references public.profiles(user_id) on delete cascade;
  end if;

  if not exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='appreciations' and column_name='occasion') then
    alter table public.appreciations add column occasion text;
  end if;

  if not exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='appreciations' and column_name='posted_to_feed') then
    alter table public.appreciations add column posted_to_feed boolean default false;
  end if;

  if not exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='appreciations' and column_name='posted_at') then
    alter table public.appreciations add column posted_at timestamptz;
  end if;
end $$;

-- Enable RLS on new tables (idempotent)
do $$ begin
  if not exists (select 1 from pg_tables where schemaname='public' and tablename='preferences' and rowsecurity) then
    alter table public.preferences enable row level security;
  end if;
  if not exists (select 1 from pg_tables where schemaname='public' and tablename='wishlist' and rowsecurity) then
    alter table public.wishlist enable row level security;
  end if;
  if not exists (select 1 from pg_tables where schemaname='public' and tablename='appreciations' and rowsecurity) then
    alter table public.appreciations enable row level security;
  end if;
end $$;

-- RLS Policies for preferences (idempotent)
do $$ begin
  if not exists (select 1 from pg_policies where tablename='preferences' and policyname='preferences: read own family') then
    create policy "preferences: read own family"
    on public.preferences for select
    using (family_id = (select family_id from public.profiles where user_id = auth.uid()));
  end if;

  if not exists (select 1 from pg_policies where tablename='preferences' and policyname='preferences: update own') then
    create policy "preferences: update own"
    on public.preferences for all
    using (user_id = auth.uid());
  end if;
end $$;

-- RLS Policies for wishlist (idempotent)
do $$ begin
  if not exists (select 1 from pg_policies where tablename='wishlist' and policyname='wishlist: read own family') then
    create policy "wishlist: read own family"
    on public.wishlist for select
    using (family_id = (select family_id from public.profiles where user_id = auth.uid()));
  end if;

  if not exists (select 1 from pg_policies where tablename='wishlist' and policyname='wishlist: manage own') then
    create policy "wishlist: manage own"
    on public.wishlist for all
    using (user_id = auth.uid());
  end if;
end $$;

-- RLS Policies for appreciations (idempotent)
do $$ begin
  if not exists (select 1 from pg_policies where tablename='appreciations' and policyname='appreciations: read own family') then
    create policy "appreciations: read own family"
    on public.appreciations for select
    using (family_id = (select family_id from public.profiles where user_id = auth.uid()));
  end if;

  if not exists (select 1 from pg_policies where tablename='appreciations' and policyname='appreciations: create own') then
    create policy "appreciations: create own"
    on public.appreciations for insert
    with check (from_user_id = auth.uid());
  end if;

  if not exists (select 1 from pg_policies where tablename='appreciations' and policyname='appreciations: update own') then
    create policy "appreciations: update own"
    on public.appreciations for update
    using (from_user_id = auth.uid());
  end if;
end $$;

-- Indexes for performance (idempotent)
create index if not exists idx_preferences_family_id on public.preferences(family_id);
create index if not exists idx_wishlist_family_user on public.wishlist(family_id, user_id);
create index if not exists idx_appreciations_family on public.appreciations(family_id);

-- Upsert helper function & triggers for updated_at (safe)
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname='preferences_updated_at') then
    create trigger preferences_updated_at
    before update on public.preferences
    for each row execute function public.set_updated_at();
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname='wishlist_updated_at') then
    create trigger wishlist_updated_at
    before update on public.wishlist
    for each row execute function public.set_updated_at();
  end if;
end $$;