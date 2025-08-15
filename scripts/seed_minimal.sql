\set ON_ERROR_STOP on

begin;

-- Insert default family
insert into public.families (name) values ('G Family')
on conflict (name) do nothing;

-- Insert the four whitelist emails
insert into public.email_whitelist (email, full_name, role) values
  ('nilezat@gmail.com', 'Ghassan', 'admin'),
  ('abdessamia.mariem@gmail.com', 'Mariem', 'admin'),
  ('yahygeemail@gmail.com', 'Yahya', 'member'),
  ('yazidgeemail@gmail.com', 'Yazid', 'member')
on conflict do nothing;

commit;