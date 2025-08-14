begin;

create table if not exists public.email_whitelist (
  email text primary key,
  full_name text,
  role public.member_role not null default 'member'
);

insert into public.email_whitelist (email, full_name, role) values
  ('nilezat@gmail.com', 'Ghassan', 'admin'),
  ('abdessamia.mariem@gmail.com', 'Mariem', 'admin'),
  ('yahygeemail@gmail.com', 'Yahya', 'member'),
  ('yazidgeemail@gmail.com', 'Yazid', 'member')
on conflict (email) do update
set full_name = excluded.full_name,
    role = excluded.role;

create or replace function public.is_whitelisted_email()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from auth.users u
    join public.email_whitelist w on w.email = u.email
    where u.id = auth.uid()
  );
$$;

create or replace function public.ensure_profile()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  uemail text;
  nm text;
  r public.member_role;
begin
  select id, email, coalesce(raw_user_meta_data->>'full_name', split_part(email,'@',1))
  into uid, uemail, nm
  from auth.users
  where id = auth.uid();

  if uid is null then
    raise exception 'ensure_profile(): no auth user';
  end if;

  if not exists (select 1 from public.email_whitelist w where w.email = uemail) then
    raise exception 'email % is not whitelisted', uemail using errcode = '42501';
  end if;

  select w.role into r from public.email_whitelist w where w.email = uemail;

  insert into public.profiles (user_id, email, full_name, role)
  values (uid, uemail, nm, r)
  on conflict (user_id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, public.profiles.full_name),
        role = excluded.role,
        updated_at = now();
end;
$$;

create or replace function public.ensure_default_family()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  fid uuid;
  uid uuid := auth.uid();
  urole public.member_role;
begin
  insert into public.families (name) values ('G Family')
    on conflict (name) do nothing;

  select id into fid from public.families where name = 'G Family';

  perform public.ensure_profile();

  select role into urole from public.profiles where user_id = uid;

  insert into public.family_memberships (family_id, user_id, role)
  values (fid, uid, urole)
  on conflict (family_id, user_id) do update
    set role = excluded.role,
        joined_at = now();

  return fid;
end;
$$;

create or replace function public.onboard_current_user()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  fid uuid;
begin
  perform public.ensure_profile();
  fid := public.ensure_default_family();
  return fid;
end;
$$;

commit;