-- scripts/verify-schema.sql
\echo 'Verifying tables, columns, types, FKs, and view…'

create or replace function public.__assert(cond boolean, msg text)
returns void
language plpgsql
as $$
begin
  if not cond then
    raise exception '%', msg;
  end if;
end$$;

-- Required tables
do $$
declare
  required text[] := array['families','profiles','events','posts','acts','feedback','notes'];
  missing text[];
begin
  select array_agg(t) filter (where t is not null)
  into missing
  from (
    select unnest(required) t
    except
    select tablename from pg_tables where schemaname='public'
  ) s;
  
  if missing is not null then
    raise exception 'Missing tables: %', array_to_string(missing, ', ');
  end if;
end$$;

-- Expected columns (table, column, udt_name, is_nullable)
with expected(table_name, column_name, udt, nullable) as (
  values
    ('families','id','uuid','NO'),
    ('families','name','text','NO'),
    ('families','created_at','timestamptz','YES'),
    ('profiles','user_id','uuid','NO'),
    ('profiles','full_name','text','YES'),
    ('profiles','dob','date','YES'),
    ('profiles','avatar_url','text','YES'),
    ('profiles','role','member_role','NO'),
    ('profiles','family_id','uuid','NO'),
    ('profiles','created_at','timestamptz','YES'),
    ('events','id','uuid','NO'),
    ('events','family_id','uuid','NO'),
    ('events','owner_id','uuid','NO'),
    ('events','title','text','NO'),
    ('events','location','text','YES'),
    ('events','starts_at','timestamptz','NO'),
    ('events','ends_at','timestamptz','YES'),
    ('events','meta','jsonb','YES'),
    ('events','created_at','timestamptz','YES'),
    ('posts','id','uuid','NO'),
    ('posts','family_id','uuid','NO'),
    ('posts','author_id','uuid','NO'),
    ('posts','body','text','NO'),
    ('posts','visibility','text','NO'),
    ('posts','audience','jsonb','YES'),
    ('posts','created_at','timestamptz','YES'),
    ('acts','id','uuid','NO'),
    ('acts','family_id','uuid','NO'),
    ('acts','user_id','uuid','NO'),
    ('acts','kind','text','NO'),
    ('acts','points','int4','YES'),
    ('acts','meta','jsonb','YES'),
    ('acts','created_at','timestamptz','YES'),
    ('feedback','id','uuid','NO'),
    ('feedback','family_id','uuid','NO'),
    ('feedback','about_id','uuid','NO'),
    ('feedback','by_id','uuid','NO'),
    ('feedback','answers','jsonb','NO'),
    ('feedback','created_at','timestamptz','YES'),
    ('notes','id','uuid','NO'),
    ('notes','family_id','uuid','NO'),
    ('notes','author_id','uuid','NO'),
    ('notes','body','text','YES'),
    ('notes','checklist','jsonb','YES'),
    ('notes','updated_at','timestamptz','YES')
),
actual as (
  select
    c.table_name,
    c.column_name,
    c.udt_name as udt,
    c.is_nullable as nullable
  from information_schema.columns c
  where c.table_schema = 'public'
)
select public.__assert(
  count() = (select count() from expected),
  format('Column mismatch. Expected %s exact matches; got %s.',
    (select count() from expected), count())
)
from expected e
join actual a on
  a.table_name = e.table_name
  and a.column_name = e.column_name
  and a.udt = e.udt
  and a.nullable = e.nullable;

-- Enum labels
do $$
declare
  labels text[];
begin
  select array_agg(e.enumlabel order by e.enumlabel)
  into labels
  from pg_type t
  join pg_enum e on e.enumtypid = t.oid
  where t.typnamespace = 'public'::regnamespace
    and t.typname = 'member_role';
  
  if labels is null or labels <> array['admin','member'] then
    raise exception 'Enum public.member_role mismatch. Found: %', labels;
  end if;
end$$;

-- View exists and references auth.uid()
do $$
begin
  perform 1 from pg_views where schemaname='public' and viewname='me';
  if not found then
    raise exception 'View public.me is missing';
  end if;
  
  if not exists (
    select 1 from pg_catalog.pg_views
    where schemaname='public' and viewname='me'
      and definition ilike '%auth.uid()%'
  ) then
    raise exception 'View public.me does not reference auth.uid()';
  end if;
end$$;

-- FK count sanity
do $$
declare
  required int := 11;
  present int := 0;
begin
  select count(*) into present
  from information_schema.table_constraints
  where table_schema='public' and constraint_type='FOREIGN KEY';
  
  if present < required then
    raise exception 'Expected at least % FK constraints, found %', required, present;
  end if;
end$$;

drop function if exists public.__assert(boolean, text);