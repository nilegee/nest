-- scripts/verify-rls.sql
\echo 'Verifying RLS and critical policies…'

-- Fail if any public table lacks RLS
do $$
declare
  missing text[];
begin
  select coalesce(array_agg(format('%I.%I', schemaname, tablename)), '{}')
  into missing
  from pg_tables t
  join pg_class c on c.relname = t.tablename and t.schemaname = 'public'
  where t.schemaname = 'public'
    and not c.relrowsecurity;

  if array_length(missing,1) is not null then
    raise exception 'RLS disabled on: %', array_to_string(missing, ', ');
  end if;
end$$;

-- Required policy names (adjust if you rename)
with required(name, table_name) as (
  values
    ('profiles: read same family','profiles'),
    ('profiles: user can update self','profiles'),
    ('profiles: admin can update family members','profiles'),
    ('families: read my family','families'),
    ('family tables: read family scope','events'),
    ('family tables: read family scope posts','posts'),
    ('family tables: read family scope acts','acts'),
    ('family tables: read family scope feedback','feedback'),
    ('family tables: read family scope notes','notes'),
    ('events: owner write','events'),
    ('posts: author write','posts'),
    ('acts: user write','acts'),
    ('feedback: writer write','feedback'),
    ('feedback: admin redact/delete','feedback'),
    ('notes: author write','notes'),
    ('events: admin manage','events'),
    ('notes: admin manage','notes')
)
select 1
from required req
left join pg_policies p on p.schemaname = 'public'
  and p.tablename = req.table_name
  and p.policyname = req.name
having count(p.policyname) <> (select count(*) from required);

do $$
declare
  missing text;
begin
  select string_agg(req.name || ' on ' || req.table_name, ', ')
  into missing
  from (
    with required(name, table_name) as (
      values
        ('profiles: read same family','profiles'),
        ('profiles: user can update self','profiles'),
        ('profiles: admin can update family members','profiles'),
        ('families: read my family','families'),
        ('family tables: read family scope','events'),
        ('family tables: read family scope posts','posts'),
        ('family tables: read family scope acts','acts'),
        ('family tables: read family scope feedback','feedback'),
        ('family tables: read family scope notes','notes'),
        ('events: owner write','events'),
        ('posts: author write','posts'),
        ('acts: user write','acts'),
        ('feedback: writer write','feedback'),
        ('feedback: admin redact/delete','feedback'),
        ('notes: author write','notes'),
        ('events: admin manage','events'),
        ('notes: admin manage','notes')
    )
    select req.*
    from required req
    left join pg_policies p on p.schemaname = 'public'
      and p.tablename = req.table_name
      and p.policyname = req.name
    where p.policyname is null
  ) x;

  if missing is not null then
    raise exception 'Missing required RLS policies: %', missing;
  end if;
end$$;