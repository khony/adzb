-- =====================================================
-- FIX INVITATIONS RLS - REMOVE AUTH.USERS QUERIES
-- =====================================================

-- Drop the problematic policies that query auth.users
DROP POLICY IF EXISTS "Users can view invitations sent to them" ON invitations;
DROP POLICY IF EXISTS "Users can accept their invitations" ON invitations;

-- Recreate policies using profiles table instead of auth.users
-- Policy: Users can view invitations sent to their email
CREATE POLICY "Users can view invitations sent to them"
  ON invitations FOR SELECT
  USING (
    email = (SELECT email FROM profiles WHERE id = auth.uid())
  );

-- Policy: Users can accept their own invitations
CREATE POLICY "Users can accept their invitations"
  ON invitations FOR UPDATE
  USING (
    email = (SELECT email FROM profiles WHERE id = auth.uid())
    AND status = 'pending'
  );
