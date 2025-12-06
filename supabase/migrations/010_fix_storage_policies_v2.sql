-- =====================================================
-- FIX STORAGE POLICIES - VERSION 2
-- Use SECURITY DEFINER function to avoid RLS issues
-- =====================================================

-- First, create a helper function to get organizations where user is admin
CREATE OR REPLACE FUNCTION get_user_admin_organizations()
RETURNS SETOF UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM organization_members
  WHERE user_id = auth.uid()
  AND role = 'admin'
$$;

-- Drop the problematic policies
DROP POLICY IF EXISTS "Admins can upload organization logos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update organization logos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete organization logos" ON storage.objects;

-- Recreate policies using the new helper function

-- Policy: Admins can upload organization logos
CREATE POLICY "Admins can upload organization logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = 'organizations' AND
  ((storage.foldername(name))[2])::uuid IN (
    SELECT * FROM get_user_admin_organizations()
  )
);

-- Policy: Admins can update organization logos
CREATE POLICY "Admins can update organization logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = 'organizations' AND
  ((storage.foldername(name))[2])::uuid IN (
    SELECT * FROM get_user_admin_organizations()
  )
);

-- Policy: Admins can delete organization logos
CREATE POLICY "Admins can delete organization logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = 'organizations' AND
  ((storage.foldername(name))[2])::uuid IN (
    SELECT * FROM get_user_admin_organizations()
  )
);
