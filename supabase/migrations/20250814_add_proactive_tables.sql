-- Add proactive system tables for signals and nudges
-- Includes proper RLS policies for family-based access control

-- Create signals table for event logging
create table if not exists public.signals(
  id bigserial primary key,
  family_id uuid not null references public.families(id) on delete cascade,
  actor_id uuid references public.profiles(id),
  type text not null,
  data jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Enable RLS on signals table
alter table public.signals enable row level security;

-- Allow family members to read their family's signals
create policy "signals family read" on public.signals for select
  using (exists (
    select 1 from public.profiles p 
    where p.id = auth.uid() and p.family_id = signals.family_id
  ));

-- Allow family members to insert signals for their family
create policy "signals family insert" on public.signals for insert
  with check (exists (
    select 1 from public.profiles p 
    where p.id = auth.uid() and p.family_id = signals.family_id
  ));

-- Create nudge_status enum type
do $$ begin 
  create type public.nudge_status as enum('pending','shown','accepted','dismissed'); 
exception when duplicate_object then null; 
end $$;

-- Create nudges table for proactive suggestions
create table if not exists public.nudges(
  id bigserial primary key,
  family_id uuid not null references public.families(id) on delete cascade,
  target_id uuid references public.profiles(id),
  type text not null,
  payload jsonb default '{}'::jsonb,
  status public.nudge_status not null default 'pending',
  created_at timestamptz default now()
);

-- Enable RLS on nudges table
alter table public.nudges enable row level security;

-- Allow family members to read their family's nudges
create policy "nudges family read" on public.nudges for select
  using (exists (
    select 1 from public.profiles p 
    where p.id = auth.uid() and p.family_id = nudges.family_id
  ));

-- Allow family members to insert nudges for their family
create policy "nudges family write" on public.nudges for insert
  with check (exists (
    select 1 from public.profiles p 
    where p.id = auth.uid() and p.family_id = nudges.family_id
  ));

-- Allow family members to update nudges for their family
create policy "nudges family update" on public.nudges for update
  using (exists (
    select 1 from public.profiles p 
    where p.id = auth.uid() and p.family_id = nudges.family_id
  ));