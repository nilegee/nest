-- 20250815130000_add_familybot_tables.sql
-- Add FamilyBot tables with correct schema (idempotent)

-- Drop existing tables if they have wrong schema
DROP TABLE IF EXISTS public.preferences CASCADE;
DROP TABLE IF EXISTS public.appreciations CASCADE;

-- User preferences for FamilyBot configuration
CREATE TABLE public.preferences (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  bot_name text DEFAULT 'FamilyBot',
  theme text DEFAULT 'classic' CHECK (theme IN ('classic','roblox-lite','minecraft-lite','pubg-lite','sims-lite')),
  language text DEFAULT 'en' CHECK (language IN ('en','ar','mix')),
  message_pack text DEFAULT 'standard' CHECK (message_pack IN ('standard','arabic_values')),
  role_tag text CHECK (role_tag IN ('mom','dad','child')),
  interests jsonb DEFAULT '[]',
  gaming_minutes_goal integer DEFAULT 120,
  quiet_hours_start time DEFAULT '22:00',
  quiet_hours_end time DEFAULT '08:00',
  nudge_cap_per_day integer DEFAULT 3,
  muted_categories jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Family member wishlists
CREATE TABLE public.wishlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  priority integer DEFAULT 1 CHECK (priority BETWEEN 1 AND 5),
  completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Appreciation/gratitude system
CREATE TABLE public.appreciations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  from_user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  to_user_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  appreciation_text text NOT NULL,
  occasion text, -- 'birthday', 'monthly_gratitude', 'kindness_response', etc
  posted_to_feed boolean DEFAULT false,
  posted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appreciations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for preferences
CREATE POLICY "preferences: read own family"
ON public.preferences FOR SELECT
USING (family_id = (SELECT family_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "preferences: update own"
ON public.preferences FOR ALL
USING (user_id = auth.uid());

-- RLS Policies for wishlist  
CREATE POLICY "wishlist: read own family"
ON public.wishlist FOR SELECT
USING (family_id = (SELECT family_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "wishlist: manage own"
ON public.wishlist FOR ALL
USING (user_id = auth.uid());

-- RLS Policies for appreciations
CREATE POLICY "appreciations: read own family"
ON public.appreciations FOR SELECT
USING (family_id = (SELECT family_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "appreciations: create own"
ON public.appreciations FOR INSERT
WITH CHECK (from_user_id = auth.uid());

CREATE POLICY "appreciations: update own"
ON public.appreciations FOR UPDATE
USING (from_user_id = auth.uid());

-- Indexes for performance
CREATE INDEX idx_preferences_family_id ON public.preferences(family_id);
CREATE INDEX idx_wishlist_family_user ON public.wishlist(family_id, user_id);
CREATE INDEX idx_appreciations_family ON public.appreciations(family_id);

-- Trigger for updated_at timestamps
CREATE TRIGGER preferences_updated_at
  BEFORE UPDATE ON public.preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER wishlist_updated_at
  BEFORE UPDATE ON public.wishlist
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();