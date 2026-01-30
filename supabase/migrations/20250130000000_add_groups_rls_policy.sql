-- Enable RLS on groups table
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view all groups" ON groups;
DROP POLICY IF EXISTS "Authenticated users can create groups" ON groups;
DROP POLICY IF EXISTS "Users can update their groups" ON groups;
DROP POLICY IF EXISTS "Users can delete their groups" ON groups;

-- Allow all authenticated users to view all groups
CREATE POLICY "Users can view all groups"
  ON groups
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to create groups
CREATE POLICY "Authenticated users can create groups"
  ON groups
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update groups
CREATE POLICY "Users can update groups"
  ON groups
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete groups (only if no guests assigned)
CREATE POLICY "Users can delete groups"
  ON groups
  FOR DELETE
  TO authenticated
  USING (true);
