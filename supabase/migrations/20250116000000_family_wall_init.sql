-- ============================================
-- FamilyNest Complete Schema Migration
-- Single Migration File - Family Wall Only
-- Created: 2025-01-16
-- ============================================

-- SECTION 1: Extensions and Types
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- SECTION 2: Core Tables - Families & Profiles
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL DEFAULT 'Family',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id),
  UNIQUE(email)
);

-- SECTION 3: Family Wall Posts
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  media_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SECTION 4: RLS Policies
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Helper function for email whitelist validation
CREATE OR REPLACE FUNCTION is_whitelisted_email(email_to_check TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN email_to_check = ANY(ARRAY[
    'yazidgeemail@gmail.com',
    'yahyageemail@gmail.com', 
    'abdessamia.mariem@gmail.com',
    'nilezat@gmail.com'
  ]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Families policies
CREATE POLICY "Whitelisted users can view families"
  ON families FOR SELECT
  USING (is_whitelisted_email(auth.jwt() ->> 'email'));

CREATE POLICY "Whitelisted users can insert families"
  ON families FOR INSERT
  WITH CHECK (is_whitelisted_email(auth.jwt() ->> 'email'));

CREATE POLICY "Whitelisted users can update families"
  ON families FOR UPDATE
  USING (is_whitelisted_email(auth.jwt() ->> 'email'))
  WITH CHECK (is_whitelisted_email(auth.jwt() ->> 'email'));

-- Profiles policies
CREATE POLICY "Whitelisted users can view profiles"
  ON profiles FOR SELECT
  USING (is_whitelisted_email(auth.jwt() ->> 'email'));

CREATE POLICY "Whitelisted users can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (
    is_whitelisted_email(auth.jwt() ->> 'email') AND
    email = auth.jwt() ->> 'email' AND
    user_id = auth.uid()
  );

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (
    user_id = auth.uid() AND
    is_whitelisted_email(auth.jwt() ->> 'email')
  )
  WITH CHECK (
    user_id = auth.uid() AND
    is_whitelisted_email(auth.jwt() ->> 'email')
  );

-- Posts policies (Family Wall)
CREATE POLICY "Family members can view posts"
  ON posts FOR SELECT
  USING (
    is_whitelisted_email(auth.jwt() ->> 'email') AND
    family_id IN (
      SELECT family_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Family members can insert posts"
  ON posts FOR INSERT
  WITH CHECK (
    is_whitelisted_email(auth.jwt() ->> 'email') AND
    author_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    ) AND
    family_id IN (
      SELECT family_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Authors can update own posts"
  ON posts FOR UPDATE
  USING (
    is_whitelisted_email(auth.jwt() ->> 'email') AND
    author_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    is_whitelisted_email(auth.jwt() ->> 'email') AND
    author_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Authors can delete own posts"
  ON posts FOR DELETE
  USING (
    is_whitelisted_email(auth.jwt() ->> 'email') AND
    author_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- SECTION 5: Indexes for Performance
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_family_id ON profiles(family_id);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_posts_family_id ON posts(family_id);
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);

-- SECTION 6: Default Family Setup
-- Insert default family for whitelisted users
INSERT INTO families (id, name) 
VALUES ('00000000-0000-0000-0000-000000000001', 'The Family')
ON CONFLICT DO NOTHING;

-- SECTION 7: Updated At Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_families_updated_at
  BEFORE UPDATE ON families
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();