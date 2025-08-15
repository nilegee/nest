-- 20250814_add_proactive_tables.sql
-- Proactive system: signals + nudges
-- Fix: reference profiles(user_id), not profiles.id
-- Safe to re-run (IF NOT EXISTS, DROP POLICY IF EXISTS)

-- ---------- SIGNALS ----------
CREATE TABLE IF NOT EXISTS public.signals(
  id         BIGSERIAL PRIMARY KEY,
  family_id  uuid NOT NULL
             REFERENCES public.families(id) ON DELETE CASCADE,
  actor_id   uuid
             REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  type       text NOT NULL,
  data       jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;

-- Indexes for common filters
CREATE INDEX IF NOT EXISTS signals_family_idx ON public.signals(family_id);
CREATE INDEX IF NOT EXISTS signals_actor_idx  ON public.signals(actor_id);
CREATE INDEX IF NOT EXISTS signals_type_idx   ON public.signals(type);

-- RLS: family members can read/insert signals for their family
DROP POLICY IF EXISTS "signals family read"   ON public.signals;
DROP POLICY IF EXISTS "signals family insert" ON public.signals;

CREATE POLICY "signals family read" ON public.signals
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.family_id = signals.family_id
    )
  );

CREATE POLICY "signals family insert" ON public.signals
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.family_id = signals.family_id
    )
  );

-- ---------- NUDGES ----------
-- Use the FamilyBot-compatible schema
CREATE TABLE IF NOT EXISTS public.nudges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  target_user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  nudge_kind text NOT NULL,
  message text NOT NULL,
  scheduled_for timestamptz NOT NULL,
  sent_at timestamptz,
  responded_at timestamptz,
  response_data jsonb,
  meta jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.nudges ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS nudges_family_idx ON public.nudges(family_id);
CREATE INDEX IF NOT EXISTS nudges_target_idx ON public.nudges(target_user_id);
CREATE INDEX IF NOT EXISTS nudges_scheduled_idx ON public.nudges(scheduled_for) WHERE sent_at IS NULL;

-- RLS: family members can read/insert/update nudges for their family
DROP POLICY IF EXISTS "nudges family read"   ON public.nudges;
DROP POLICY IF EXISTS "nudges family write"  ON public.nudges;
DROP POLICY IF EXISTS "nudges family update" ON public.nudges;

CREATE POLICY "nudges family read" ON public.nudges
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.family_id = nudges.family_id
    )
  );

CREATE POLICY "nudges family write" ON public.nudges
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.family_id = nudges.family_id
    )
  );

CREATE POLICY "nudges family update" ON public.nudges
  FOR UPDATE
  USING (
    target_user_id = auth.uid()
  );
