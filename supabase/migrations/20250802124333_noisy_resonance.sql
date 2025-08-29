/*
  # Family Sharing Schema

  1. New Tables
    - `family_groups`
      - `id` (uuid, primary key)
      - `name` (text)
      - `created_by` (uuid, references users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `family_members`
      - `id` (uuid, primary key)
      - `family_group_id` (uuid, references family_groups)
      - `user_id` (uuid, references users)
      - `role` (text, check constraint)
      - `joined_at` (timestamp)
      - `invited_by` (uuid, references users)
    
    - `family_invites`
      - `id` (uuid, primary key)
      - `family_group_id` (uuid, references family_groups)
      - `email` (text)
      - `role` (text, check constraint)
      - `invited_by` (uuid, references users)
      - `expires_at` (timestamp)
      - `accepted` (boolean)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for family-based access control
*/

-- Create family_groups table
CREATE TABLE IF NOT EXISTS family_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create family_members table
CREATE TABLE IF NOT EXISTS family_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_group_id uuid REFERENCES family_groups(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'member', 'viewer')),
  joined_at timestamptz DEFAULT now(),
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(family_group_id, user_id)
);

-- Create family_invites table
CREATE TABLE IF NOT EXISTS family_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_group_id uuid REFERENCES family_groups(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'member', 'viewer')),
  invited_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  expires_at timestamptz NOT NULL,
  accepted boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_family_members_group_id ON family_members(family_group_id);
CREATE INDEX IF NOT EXISTS idx_family_members_user_id ON family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_family_invites_email ON family_invites(email);
CREATE INDEX IF NOT EXISTS idx_family_invites_expires ON family_invites(expires_at) WHERE NOT accepted;

-- Enable Row Level Security
ALTER TABLE family_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_invites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for family_groups
CREATE POLICY "Users can view family groups they belong to"
  ON family_groups
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT family_group_id 
      FROM family_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create family groups"
  ON family_groups
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admins can update family groups"
  ON family_groups
  FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT family_group_id 
      FROM family_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for family_members
CREATE POLICY "Users can view family members in their groups"
  ON family_members
  FOR SELECT
  TO authenticated
  USING (
    family_group_id IN (
      SELECT family_group_id 
      FROM family_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage family members"
  ON family_members
  FOR ALL
  TO authenticated
  USING (
    family_group_id IN (
      SELECT family_group_id 
      FROM family_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can join families when invited"
  ON family_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM family_invites 
      WHERE family_group_id = family_members.family_group_id 
      AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND NOT accepted 
      AND expires_at > now()
    )
  );

-- RLS Policies for family_invites
CREATE POLICY "Users can view invites for their groups"
  ON family_invites
  FOR SELECT
  TO authenticated
  USING (
    family_group_id IN (
      SELECT family_group_id 
      FROM family_members 
      WHERE user_id = auth.uid() AND role IN ('admin', 'member')
    )
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Admins and members can create invites"
  ON family_invites
  FOR INSERT
  TO authenticated
  WITH CHECK (
    invited_by = auth.uid() AND
    family_group_id IN (
      SELECT family_group_id 
      FROM family_members 
      WHERE user_id = auth.uid() AND role IN ('admin', 'member')
    )
  );

CREATE POLICY "Users can update their own invites"
  ON family_invites
  FOR UPDATE
  TO authenticated
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Create trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_family_groups_updated_at 
  BEFORE UPDATE ON family_groups 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();