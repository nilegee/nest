-- Fail fast if expectations are not met
-- 1) Required columns exist
do $$ begin
  if not exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='profiles' and column_name='dob')
  then raise exception 'profiles.dob missing'; end if;
end $$;

-- 2) /rest/v1/me view exists with expected columns
do $$ begin
  if not exists (select 1 from information_schema.views
                 where table_schema='public' and table_name='me')
  then raise exception 'view public.me missing'; end if;
end $$;

-- 3) RLS enabled on key tables
do $$ declare bad text; begin
  select string_agg(relname, ',')
  into bad
  from pg_class c
  join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public'
    and c.relname in ('profiles','notes','acts','wishlist','nudges','preferences')
    and coalesce(c.relrowsecurity,false)=false;
  if bad is not null then
    raise exception 'RLS disabled on: %', bad;
  end if;
end $$;

-- 4) Required policies exist (sample)
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='notes' and policyname='notes family select')
  then raise exception 'policy notes family select missing'; end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='acts' and policyname='acts family insert')
  then raise exception 'policy acts family insert missing'; end if;
end $$;

-- 5) Sanity: families table present
do $$ begin
  perform 1 from public.families limit 1;
  -- ok even if 0 rows; just ensure the table is usable
end $$;

select 'smoke ok' as status;