-- =====================================================
-- FIX PROFILES RLS - VERSION 2 (IMPROVED)
-- =====================================================

-- Drop all existing SELECT policies on profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles of organization members" ON profiles;

-- Create new policies with improved logic

-- Policy 1: Users can always view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy 2: Users can view profiles of other members in their organizations
-- This uses a simpler join approach without the helper function
CREATE POLICY "Users can view org member profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM organization_members om1
      INNER JOIN organization_members om2
        ON om1.organization_id = om2.organization_id
      WHERE om1.user_id = profiles.id
        AND om2.user_id = auth.uid()
    )
  );
