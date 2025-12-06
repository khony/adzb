-- =====================================================
-- FIX STORAGE POLICIES FOR AVATARS
-- =====================================================

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;

-- Create new INSERT policies with proper folder structure checks

-- Policy: Users can upload their own avatars
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = 'users' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy: Admins can upload organization logos
CREATE POLICY "Admins can upload organization logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = 'organizations' AND
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.organization_id = ((storage.foldername(name))[2])::uuid
    AND organization_members.user_id = auth.uid()
    AND organization_members.role = 'admin'
  )
);
