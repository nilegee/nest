-- Migration: Fix email_whitelist constraints and add case-insensitive unique index
-- Drops any mistaken constraint named email_whitelist_lower_email_unique
-- Creates a UNIQUE expression index on lower(email) for case-insensitive uniqueness

begin;

-- Drop the mistaken constraint if it exists
do $$
begin
  if exists (
    select 1 
    from information_schema.table_constraints 
    where constraint_schema = 'public' 
      and constraint_name = 'email_whitelist_lower_email_unique'
      and table_name = 'email_whitelist'
  ) then
    alter table public.email_whitelist 
    drop constraint email_whitelist_lower_email_unique;
    
    raise notice 'Dropped constraint email_whitelist_lower_email_unique';
  end if;
exception 
  when others then
    raise notice 'Could not drop constraint email_whitelist_lower_email_unique: %', sqlerrm;
end $$;

-- Create unique expression index on lower(email) if it doesn't exist
create unique index if not exists email_whitelist_lower_email_idx 
on public.email_whitelist (lower(email));

commit;