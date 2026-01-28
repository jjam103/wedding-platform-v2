-- Migration: Create Row Level Security policies
-- Requirements: 2.2, 2.3, 2.6

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================

-- Users can view their own information
CREATE POLICY "users_view_own_info"
ON users FOR SELECT
USING (auth.uid() = id);

-- Super admins can view all users
CREATE POLICY "super_admins_view_all_users"
ON users FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- Users can update their own last_login
CREATE POLICY "users_update_own_last_login"
ON users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Super admins can manage all users
CREATE POLICY "super_admins_manage_users"
ON users FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- ============================================================================
-- GROUPS TABLE POLICIES
-- ============================================================================

-- Super admins and hosts can view all groups
CREATE POLICY "admins_hosts_view_groups"
ON groups FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'host')
  )
);

-- Group owners can view their groups
CREATE POLICY "group_owners_view_their_groups"
ON groups FOR SELECT
USING (
  id IN (
    SELECT group_id FROM group_members 
    WHERE user_id = auth.uid()
  )
);

-- Super admins and hosts can manage groups
CREATE POLICY "admins_hosts_manage_groups"
ON groups FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'host')
  )
);

-- ============================================================================
-- GROUP_MEMBERS TABLE POLICIES
-- ============================================================================

-- Super admins and hosts can view all group members
CREATE POLICY "admins_hosts_view_group_members"
ON group_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'host')
  )
);

-- Group owners can view members of their groups
CREATE POLICY "group_owners_view_their_members"
ON group_members FOR SELECT
USING (
  group_id IN (
    SELECT group_id FROM group_members 
    WHERE user_id = auth.uid()
  )
);

-- Super admins and hosts can manage group members
CREATE POLICY "admins_hosts_manage_group_members"
ON group_members FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'host')
  )
);

-- ============================================================================
-- GUESTS TABLE POLICIES
-- ============================================================================

-- Super admins can access all guests
CREATE POLICY "super_admins_access_all_guests"
ON guests FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- Hosts can access all guests
CREATE POLICY "hosts_access_all_guests"
ON guests FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'host'
  )
);

-- Group owners can access their assigned guests
CREATE POLICY "group_owners_access_their_guests"
ON guests FOR ALL
USING (
  group_id IN (
    SELECT group_id FROM group_members 
    WHERE user_id = auth.uid() AND role = 'owner'
  )
);

-- Guests can view their own information
CREATE POLICY "guests_view_own_info"
ON guests FOR SELECT
USING (
  email IS NOT NULL AND 
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Adult guests can view and edit family members in their group
CREATE POLICY "adults_view_family"
ON guests FOR SELECT
USING (
  group_id IN (
    SELECT group_id FROM guests 
    WHERE email IS NOT NULL 
    AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND age_type = 'adult'
  )
);

CREATE POLICY "adults_update_family"
ON guests FOR UPDATE
USING (
  group_id IN (
    SELECT group_id FROM guests 
    WHERE email IS NOT NULL 
    AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND age_type = 'adult'
  )
)
WITH CHECK (
  group_id IN (
    SELECT group_id FROM guests 
    WHERE email IS NOT NULL 
    AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND age_type = 'adult'
  )
);

-- Child guests can only update their own information
CREATE POLICY "children_update_own_info"
ON guests FOR UPDATE
USING (
  email IS NOT NULL AND 
  email = (SELECT email FROM auth.users WHERE id = auth.uid()) AND
  age_type = 'child'
)
WITH CHECK (
  email IS NOT NULL AND 
  email = (SELECT email FROM auth.users WHERE id = auth.uid()) AND
  age_type = 'child'
);

-- ============================================================================
-- LOCATIONS TABLE POLICIES
-- ============================================================================

-- Super admins and hosts can manage all locations
CREATE POLICY "admins_hosts_manage_locations"
ON locations FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'host')
  )
);

-- All authenticated users can view locations
CREATE POLICY "authenticated_view_locations"
ON locations FOR SELECT
USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- EVENTS TABLE POLICIES
-- ============================================================================

-- Super admins and hosts can manage all events
CREATE POLICY "admins_hosts_manage_events"
ON events FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'host')
  )
);

-- Guests can view published events matching their guest_type
CREATE POLICY "guests_view_published_events"
ON events FOR SELECT
USING (
  status = 'published' 
  AND (
    visibility = '{}' OR 
    EXISTS (
      SELECT 1 FROM guests 
      WHERE email IS NOT NULL 
      AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND (
        visibility = '{}' OR 
        guest_type = ANY(events.visibility)
      )
    )
  )
);

-- ============================================================================
-- ACTIVITIES TABLE POLICIES
-- ============================================================================

-- Super admins and hosts can manage all activities
CREATE POLICY "admins_hosts_manage_activities"
ON activities FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'host')
  )
);

-- Guests can view published activities matching their guest_type
CREATE POLICY "guests_view_published_activities"
ON activities FOR SELECT
USING (
  status = 'published' 
  AND (
    visibility = '{}' OR 
    EXISTS (
      SELECT 1 FROM guests 
      WHERE email IS NOT NULL 
      AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND (
        visibility = '{}' OR 
        guest_type = ANY(activities.visibility)
      )
    )
  )
);

-- ============================================================================
-- RSVPS TABLE POLICIES
-- ============================================================================

-- Super admins and hosts can view all RSVPs
CREATE POLICY "admins_hosts_view_all_rsvps"
ON rsvps FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'host')
  )
);

-- Guests can manage their own RSVPs
CREATE POLICY "guests_manage_own_rsvps"
ON rsvps FOR ALL
USING (
  guest_id IN (
    SELECT id FROM guests 
    WHERE email IS NOT NULL 
    AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
)
WITH CHECK (
  guest_id IN (
    SELECT id FROM guests 
    WHERE email IS NOT NULL 
    AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- Adult family members can manage RSVPs for their family
CREATE POLICY "adults_manage_family_rsvps"
ON rsvps FOR ALL
USING (
  guest_id IN (
    SELECT g2.id FROM guests g1
    JOIN guests g2 ON g1.group_id = g2.group_id
    WHERE g1.email IS NOT NULL 
    AND g1.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND g1.age_type = 'adult'
  )
)
WITH CHECK (
  guest_id IN (
    SELECT g2.id FROM guests g1
    JOIN guests g2 ON g1.group_id = g2.group_id
    WHERE g1.email IS NOT NULL 
    AND g1.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND g1.age_type = 'adult'
  )
);

-- Group owners can view RSVPs for their group members
CREATE POLICY "group_owners_view_group_rsvps"
ON rsvps FOR SELECT
USING (
  guest_id IN (
    SELECT id FROM guests 
    WHERE group_id IN (
      SELECT group_id FROM group_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  )
);

-- Comments for documentation
COMMENT ON POLICY "super_admins_access_all_guests" ON guests IS 'Super admins have full access to all guest records';
COMMENT ON POLICY "group_owners_access_their_guests" ON guests IS 'Group owners can only access guests in their assigned groups (Property 3: Group Data Isolation)';
COMMENT ON POLICY "adults_view_family" ON guests IS 'Adult family members can view all members in their group (Property 18: Adult Family Member Access)';
COMMENT ON POLICY "children_update_own_info" ON guests IS 'Child guests can only update their own information (Property 19: Child Access Restriction)';
COMMENT ON POLICY "guests_view_published_events" ON events IS 'Guests can only view published events matching their guest_type';
COMMENT ON POLICY "guests_manage_own_rsvps" ON rsvps IS 'Guests can manage their own RSVPs';
