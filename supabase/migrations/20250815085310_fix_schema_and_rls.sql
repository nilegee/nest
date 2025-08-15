-- 20250815085310_fix_schema_and_rls.sql
-- Comprehensive fix for schema alignment and RLS policies
-- Idempotent migration that addresses console errors and blank dashboard

-- === PROFILES shape alignment ===
CREATE TABLE IF NOT EXISTS public.profiles(
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  family_id uuid,
  avatar_url text,
  dob date,
  created_at timestamptz DEFAULT now()
);

-- ensure dob exists even if table pre-existed
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema='public' AND table_name='profiles' AND column_name='dob') THEN
    ALTER TABLE public.profiles ADD COLUMN dob date;
  END IF;
END $$;

-- families table (minimal) - only if missing
CREATE TABLE IF NOT EXISTS public.families(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- preferences (for bot) - minimal if missing
CREATE TABLE IF NOT EXISTS public.preferences(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- wishlist minimal if missing
CREATE TABLE IF NOT EXISTS public.wishlist(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  title text NOT NULL,
  priority int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- events minimal if missing
CREATE TABLE IF NOT EXISTS public.events(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL,
  title text NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  created_by uuid REFERENCES public.profiles(user_id),
  created_at timestamptz DEFAULT now()
);

-- notes minimal if missing
CREATE TABLE IF NOT EXISTS public.notes(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  family_id uuid,
  content text,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- acts minimal if missing
CREATE TYPE IF NOT EXISTS act_kind AS ENUM ('chore_complete','goal_progress','post','habit');
CREATE TABLE IF NOT EXISTS public.acts(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL,
  assignee_id uuid REFERENCES public.profiles(user_id),
  kind act_kind NOT NULL,
  qty int DEFAULT 1,
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- nudges minimal if missing
CREATE TABLE IF NOT EXISTS public.nudges(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL,
  target_user_id uuid REFERENCES public.profiles(user_id),
  message text NOT NULL,
  scheduled_for timestamptz,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- === Ensure RLS ===
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nudges ENABLE ROW LEVEL SECURITY;

-- Helper: family-of-current-user
CREATE OR REPLACE VIEW public._current_user_family AS
SELECT p.user_id, p.family_id FROM public.profiles p
WHERE p.user_id = auth.uid();

-- PROFILES policies: self read/write + same-family read
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='profiles self or family read') THEN
    CREATE POLICY "profiles self or family read" ON public.profiles
      FOR SELECT USING (
        user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.profiles me
          WHERE me.user_id = auth.uid() AND me.family_id = profiles.family_id
        )
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='profiles self upsert') THEN
    CREATE POLICY "profiles self upsert" ON public.profiles
      FOR ALL USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- FAMILY-scoped generic policy generator
-- All these tables must have family_id (or user_id) columns; adapt accordingly.

-- NOTES
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notes' AND policyname='notes family select') THEN
    CREATE POLICY "notes family select" ON public.notes
      FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles me WHERE me.user_id=auth.uid() AND me.family_id = notes.family_id)
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notes' AND policyname='notes family insert') THEN
    CREATE POLICY "notes family insert" ON public.notes
      FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles me WHERE me.user_id=auth.uid() AND (notes.family_id IS NULL OR me.family_id = notes.family_id))
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notes' AND policyname='notes author update') THEN
    CREATE POLICY "notes author update" ON public.notes
      FOR UPDATE USING (author_id = auth.uid());
  END IF;
END $$;

-- EVENTS
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='events' AND policyname='events family select') THEN
    CREATE POLICY "events family select" ON public.events
      FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles me WHERE me.user_id=auth.uid() AND me.family_id = events.family_id)
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='events' AND policyname='events family insert') THEN
    CREATE POLICY "events family insert" ON public.events
      FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles me WHERE me.user_id=auth.uid() AND me.family_id = events.family_id)
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='events' AND policyname='events author update') THEN
    CREATE POLICY "events author update" ON public.events
      FOR UPDATE USING (created_by = auth.uid());
  END IF;
END $$;

-- WISHLIST
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='wishlist' AND policyname='wishlist owner select') THEN
    CREATE POLICY "wishlist owner select" ON public.wishlist
      FOR SELECT USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='wishlist' AND policyname='wishlist owner crud') THEN
    CREATE POLICY "wishlist owner crud" ON public.wishlist
      FOR ALL USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- PREFERENCES
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='preferences' AND policyname='preferences owner read') THEN
    CREATE POLICY "preferences owner read" ON public.preferences
      FOR SELECT USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='preferences' AND policyname='preferences owner upsert') THEN
    CREATE POLICY "preferences owner upsert" ON public.preferences
      FOR ALL USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- ACTS (family scoped)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='acts' AND policyname='acts family read') THEN
    CREATE POLICY "acts family read" ON public.acts
      FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles me WHERE me.user_id=auth.uid() AND me.family_id = acts.family_id)
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='acts' AND policyname='acts family insert') THEN
    CREATE POLICY "acts family insert" ON public.acts
      FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles me WHERE me.user_id=auth.uid() AND me.family_id = acts.family_id)
      );
  END IF;
END $$;

-- NUDGES (family scoped read/queue)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='nudges' AND policyname='nudges family read') THEN
    CREATE POLICY "nudges family read" ON public.nudges
      FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles me WHERE me.user_id=auth.uid() AND me.family_id = nudges.family_id)
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='nudges' AND policyname='nudges family insert') THEN
    CREATE POLICY "nudges family insert" ON public.nudges
      FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles me WHERE me.user_id=auth.uid() AND me.family_id = nudges.family_id)
      );
  END IF;
END $$;

-- "me" view for PostgREST /rest/v1/me
CREATE OR REPLACE VIEW public.me AS
SELECT p.user_id, p.full_name, p.family_id, p.dob, p.avatar_url
FROM public.profiles p
WHERE p.user_id = auth.uid();

GRANT SELECT ON public.me TO anon, authenticated;

-- FIRST-LOGIN bootstrap: ensure profile row exists for new auth user
CREATE OR REPLACE FUNCTION public.ensure_profile_for_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY definer SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles(user_id, full_name, family_id)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)), null)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.ensure_profile_for_new_user();
  END IF;
END $$;