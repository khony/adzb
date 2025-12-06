-- =====================================================
-- FIX RLS INFINITE RECURSION ON ORGANIZATION_MEMBERS
-- =====================================================

-- The issue: The SELECT policy on organization_members was querying
-- organization_members itself, causing infinite recursion.
--
-- Solution: Create a SECURITY DEFINER function that bypasses RLS
-- to get user's organizations, then use it in policies.

-- =============================================================================
-- 1. CREATE HELPER FUNCTION (bypasses RLS)
-- =============================================================================

CREATE OR REPLACE FUNCTION get_user_organizations()
RETURNS SETOF UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM organization_members
  WHERE user_id = auth.uid()
$$;

-- =============================================================================
-- 2. DROP OLD RECURSIVE POLICIES
-- =============================================================================

DROP POLICY IF EXISTS "Members can view organization members" ON organization_members;
DROP POLICY IF EXISTS "Admins can insert members" ON organization_members;
DROP POLICY IF EXISTS "Admins can update members" ON organization_members;
DROP POLICY IF EXISTS "Admins can delete members" ON organization_members;

-- =============================================================================
-- 3. CREATE NEW NON-RECURSIVE POLICIES
-- =============================================================================

-- Members: Can view members in organizations they belong to
CREATE POLICY "Members can view organization members"
  ON organization_members FOR SELECT
  USING (
    organization_id IN (SELECT get_user_organizations())
  );

-- Members: Admins can add members to their organizations
CREATE POLICY "Admins can insert members"
  ON organization_members FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Members: Admins can update member roles in their organizations
CREATE POLICY "Admins can update members"
  ON organization_members FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Members: Admins can remove members (except themselves)
CREATE POLICY "Admins can delete members"
  ON organization_members FOR DELETE
  USING (
    user_id != auth.uid()
    AND organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
