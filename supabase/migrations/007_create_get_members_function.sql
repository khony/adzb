-- =====================================================
-- CREATE FUNCTION TO GET ORGANIZATION MEMBERS
-- =====================================================

-- This function bypasses RLS to fetch organization members with their profiles
-- Users can only call it for organizations they are members of

CREATE OR REPLACE FUNCTION get_organization_members(org_id UUID)
RETURNS TABLE (
  id UUID,
  organization_id UUID,
  user_id UUID,
  role member_role,
  invited_by UUID,
  joined_at TIMESTAMP WITH TIME ZONE,
  profile_id UUID,
  profile_email TEXT,
  profile_full_name TEXT,
  profile_avatar_url TEXT,
  profile_created_at TIMESTAMP WITH TIME ZONE,
  profile_updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- First verify that the calling user is a member of this organization
  SELECT
    om.id,
    om.organization_id,
    om.user_id,
    om.role,
    om.invited_by,
    om.joined_at,
    p.id as profile_id,
    p.email as profile_email,
    p.full_name as profile_full_name,
    p.avatar_url as profile_avatar_url,
    p.created_at as profile_created_at,
    p.updated_at as profile_updated_at
  FROM organization_members om
  INNER JOIN profiles p ON p.id = om.user_id
  WHERE om.organization_id = org_id
    -- Only allow if the calling user is also a member of this organization
    AND EXISTS (
      SELECT 1 FROM organization_members om2
      WHERE om2.organization_id = org_id
      AND om2.user_id = auth.uid()
    )
  ORDER BY om.joined_at DESC;
$$;
