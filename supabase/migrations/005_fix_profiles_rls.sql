-- =====================================================
-- FIX PROFILES RLS TO ALLOW VIEWING ORG MEMBERS
-- =====================================================

-- Drop the old restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- Create new policies that allow viewing:
-- 1. Own profile
-- 2. Profiles of users in the same organization

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can view profiles of organization members"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om1
      WHERE om1.user_id = profiles.id
      AND om1.organization_id IN (
        SELECT organization_id
        FROM get_user_organizations()
      )
    )
  );
