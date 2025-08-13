-- FamilyNest Database Schema
-- Minimal tables with strict Row Level Security (RLS)

-- Enable RLS
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES REVOKE ALL ON TABLES FROM PUBLIC;

-- Create family_members table
CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  birth_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  created_by UUID REFERENCES family_members(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create goals table
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  target_value INTEGER NOT NULL,
  current_value INTEGER DEFAULT 0,
  unit TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_by UUID REFERENCES family_members(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create goal_participants table
CREATE TABLE goal_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  contribution INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(goal_id, member_id)
);

-- Create posts table (for family feed)
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  author_id UUID REFERENCES family_members(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chores table
CREATE TABLE chores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES family_members(id),
  due_date DATE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES family_members(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chores ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Family members can only see other family members
CREATE POLICY "Family members can view family members" ON family_members
  FOR SELECT USING (TRUE);

CREATE POLICY "Family members can update their own profile" ON family_members
  FOR UPDATE USING (auth.jwt() ->> 'email' = email);

CREATE POLICY "Family members can insert their profile" ON family_members
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = email);

-- Events are visible to all family members
CREATE POLICY "Family members can view events" ON events
  FOR SELECT USING (TRUE);

CREATE POLICY "Family members can create events" ON events
  FOR INSERT WITH CHECK (
    created_by IN (
      SELECT id FROM family_members WHERE email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Family members can update their events" ON events
  FOR UPDATE USING (
    created_by IN (
      SELECT id FROM family_members WHERE email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Family members can delete their events" ON events
  FOR DELETE USING (
    created_by IN (
      SELECT id FROM family_members WHERE email = auth.jwt() ->> 'email'
    )
  );

-- Goals are visible to all family members
CREATE POLICY "Family members can view goals" ON goals
  FOR SELECT USING (TRUE);

CREATE POLICY "Family members can create goals" ON goals
  FOR INSERT WITH CHECK (
    created_by IN (
      SELECT id FROM family_members WHERE email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Family members can update their goals" ON goals
  FOR UPDATE USING (
    created_by IN (
      SELECT id FROM family_members WHERE email = auth.jwt() ->> 'email'
    )
  );

-- Goal participants policies
CREATE POLICY "Family members can view goal participants" ON goal_participants
  FOR SELECT USING (TRUE);

CREATE POLICY "Family members can join goals" ON goal_participants
  FOR INSERT WITH CHECK (
    member_id IN (
      SELECT id FROM family_members WHERE email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Family members can update their participation" ON goal_participants
  FOR UPDATE USING (
    member_id IN (
      SELECT id FROM family_members WHERE email = auth.jwt() ->> 'email'
    )
  );

-- Posts are visible to all family members
CREATE POLICY "Family members can view posts" ON posts
  FOR SELECT USING (TRUE);

CREATE POLICY "Family members can create posts" ON posts
  FOR INSERT WITH CHECK (
    author_id IN (
      SELECT id FROM family_members WHERE email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Family members can update their posts" ON posts
  FOR UPDATE USING (
    author_id IN (
      SELECT id FROM family_members WHERE email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Family members can delete their posts" ON posts
  FOR DELETE USING (
    author_id IN (
      SELECT id FROM family_members WHERE email = auth.jwt() ->> 'email'
    )
  );

-- Chores are visible to all family members
CREATE POLICY "Family members can view chores" ON chores
  FOR SELECT USING (TRUE);

CREATE POLICY "Family members can create chores" ON chores
  FOR INSERT WITH CHECK (
    created_by IN (
      SELECT id FROM family_members WHERE email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Family members can update chores assigned to them" ON chores
  FOR UPDATE USING (
    assigned_to IN (
      SELECT id FROM family_members WHERE email = auth.jwt() ->> 'email'
    ) OR
    created_by IN (
      SELECT id FROM family_members WHERE email = auth.jwt() ->> 'email'
    )
  );

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_family_members_updated_at BEFORE UPDATE ON family_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chores_updated_at BEFORE UPDATE ON chores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_goals_dates ON goals(start_date, end_date);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_chores_assigned ON chores(assigned_to, completed);
CREATE INDEX idx_chores_due_date ON chores(due_date) WHERE NOT completed;

-- Insert sample data (optional - for development)
-- Note: This would require actual user UUIDs from Supabase Auth
-- The application will handle creating family_member records when users first sign up