create index if not exists idx_profiles_user_id on public.profiles(user_id);
create index if not exists idx_notes_author_updated on public.notes(author_id, updated_at desc);
create index if not exists idx_wishlist_user_priority on public.wishlist(user_id, priority desc, created_at desc);
create index if not exists idx_nudges_family_schedule on public.nudges(family_id, scheduled_for);