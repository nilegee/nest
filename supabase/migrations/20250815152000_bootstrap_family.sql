-- Ensure every authenticated user can get a family_id
create or replace function public.ensure_family_for_user()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare fam uuid;
begin
  select family_id into fam from public.profiles where user_id = auth.uid();

  if fam is null then
    insert into public.families(name) values ('My Family') returning id into fam;
    update public.profiles set family_id = fam where user_id = auth.uid();
  end if;

  return fam;
end;
$$;

grant execute on function public.ensure_family_for_user() to authenticated;