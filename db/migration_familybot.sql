-- ============================================
-- FamilyBot Migration: Add new tables
-- Adds preferences, wishlist, nudges, appreciations
-- ============================================

-- User preferences for FamilyBot configuration
create table public.preferences (
  user_id uuid primary key references public.profiles(user_id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  bot_name text default 'FamilyBot',
  theme text default 'classic' check (theme in ('classic','roblox-lite','minecraft-lite','pubg-lite','sims-lite')),
  language text default 'en' check (language in ('en','ar','mix')),
  message_pack text default 'standard' check (message_pack in ('standard','arabic_values')),
  role_tag text check (role_tag in ('mom','dad','child')),
  interests jsonb default '[]',
  gaming_minutes_goal integer default 120,
  quiet_hours_start time default '22:00',
  quiet_hours_end time default '08:00',
  nudge_cap_per_day integer default 3,
  muted_categories jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Family member wishlists
create table public.wishlist (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  title text not null,
  description text,
  priority integer default 1 check (priority between 1 and 5),
  completed boolean default false,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Scheduled nudges/messages from FamilyBot
create table public.nudges (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  target_user_id uuid not null references public.profiles(user_id) on delete cascade,
  nudge_kind text not null,
  message text not null,
  scheduled_for timestamptz not null,
  sent_at timestamptz,
  responded_at timestamptz,
  response_data jsonb,
  meta jsonb default '{}',
  created_at timestamptz default now()
);

-- Appreciation/gratitude system
create table public.appreciations (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  from_user_id uuid not null references public.profiles(user_id) on delete cascade,
  to_user_id uuid references public.profiles(user_id) on delete cascade,
  appreciation_text text not null,
  occasion text, -- 'birthday', 'monthly_gratitude', 'kindness_response', etc
  posted_to_feed boolean default false,
  posted_at timestamptz,
  created_at timestamptz default now()
);

-- Enable RLS on new tables
alter table public.preferences enable row level security;
alter table public.wishlist enable row level security;
alter table public.nudges enable row level security;
alter table public.appreciations enable row level security;

-- RLS Policies for preferences
create policy "preferences: read own family"
on public.preferences for select
using (family_id = (select family_id from public.profiles where user_id = auth.uid()));

create policy "preferences: update own"
on public.preferences for all
using (user_id = auth.uid());

-- RLS Policies for wishlist  
create policy "wishlist: read own family"
on public.wishlist for select
using (family_id = (select family_id from public.profiles where user_id = auth.uid()));

create policy "wishlist: manage own"
on public.wishlist for all
using (user_id = auth.uid());

-- RLS Policies for nudges
create policy "nudges: read own family"
on public.nudges for select
using (family_id = (select family_id from public.profiles where user_id = auth.uid()));

create policy "nudges: target user can update response"
on public.nudges for update
using (target_user_id = auth.uid());

-- RLS Policies for appreciations
create policy "appreciations: read own family"
on public.appreciations for select
using (family_id = (select family_id from public.profiles where user_id = auth.uid()));

create policy "appreciations: create own"
on public.appreciations for insert
with check (from_user_id = auth.uid());

create policy "appreciations: update own"
on public.appreciations for update
using (from_user_id = auth.uid());

-- Indexes for performance
create index idx_preferences_family_id on public.preferences(family_id);
create index idx_wishlist_family_user on public.wishlist(family_id, user_id);
create index idx_nudges_scheduled on public.nudges(scheduled_for) where sent_at is null;
create index idx_nudges_family_target on public.nudges(family_id, target_user_id);
create index idx_appreciations_family on public.appreciations(family_id);

-- Trigger for updated_at timestamps
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger preferences_updated_at
  before update on public.preferences
  for each row
  execute function public.set_updated_at();

create trigger wishlist_updated_at
  before update on public.wishlist
  for each row
  execute function public.set_updated_at();