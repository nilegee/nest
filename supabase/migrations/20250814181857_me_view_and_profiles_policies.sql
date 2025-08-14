-- Ensure RLS on profiles
alter table if exists public.profiles enable row level security;

-- Policies: owner can select/update own profile
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (user_id = auth.uid());

-- Optional: admins can read all (relies on JWT claim role='admin')
drop policy if exists "profiles_select_admin" on public.profiles;
create policy "profiles_select_admin"
  on public.profiles
  for select
  to authenticated
  using (coalesce((auth.jwt()->>'role') = 'admin', false));

-- Create or replace a view that exposes only the current user's row
create or replace view public.me as
  select p.*
  from public.profiles p
  where p.user_id = auth.uid();

-- Grant select on the view to authenticated (view respects table RLS)
revoke all on public.me from public, anon, authenticated;
grant select on public.me to authenticated;