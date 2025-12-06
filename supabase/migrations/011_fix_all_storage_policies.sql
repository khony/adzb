-- =====================================================
-- FIX ALL STORAGE POLICIES - COMPREHENSIVE FIX
-- =====================================================

-- Create helper function for admin organizations (if not exists)
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

-- Drop ALL existing policies on storage.objects for avatars bucket
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload organization logos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update organization logos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete organization logos" ON storage.objects;
DROP POLICY IF EXISTS "Public avatar access" ON storage.objects;

-- =============================================================================
-- CREATE ALL STORAGE POLICIES FROM SCRATCH
-- =============================================================================

-- SELECT: Anyone can view avatars (public bucket)
CREATE POLICY "Public avatar access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- INSERT: Users can upload their own avatars
CREATE POLICY "Users can insert own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = 'users' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- INSERT: Admins can upload organization logos
CREATE POLICY "Admins can insert organization logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = 'organizations' AND
  ((storage.foldername(name))[2])::uuid IN (
    SELECT * FROM get_user_admin_organizations()
  )
);

-- UPDATE: Users can update their own avatars
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = 'users' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- UPDATE: Admins can update organization logos
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

-- DELETE: Users can delete their own avatars
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = 'users' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- DELETE: Admins can delete organization logos
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
