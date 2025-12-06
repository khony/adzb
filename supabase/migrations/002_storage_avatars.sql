-- =====================================================
-- STORAGE CONFIGURATION FOR AVATARS
-- =====================================================

-- =============================================================================
-- 1. CREATE STORAGE BUCKET
-- =============================================================================

-- Create avatars bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 2. ENABLE RLS ON STORAGE
-- =============================================================================

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 3. CREATE STORAGE POLICIES
-- =============================================================================

-- Policy: Authenticated users can upload avatars
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Policy: Users can update their own avatars
-- Format: avatars/users/{user_id}/avatar.jpg or avatars/organizations/{org_id}/logo.jpg
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND (
    -- User can update their own user avatar
    (storage.foldername(name))[1] = 'users' AND
    (storage.foldername(name))[2] = auth.uid()::text
  )
);

-- Policy: Admins can update organization logos
CREATE POLICY "Admins can update organization logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = 'organizations' AND
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.organization_id = (storage.foldername(name))[2]::uuid
    AND organization_members.user_id = auth.uid()
    AND organization_members.role = 'admin'
  )
);

-- Policy: Anyone can view avatars (public bucket)
CREATE POLICY "Public avatar access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Policy: Users can delete their own avatars
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND (
    -- User can delete their own user avatar
    (storage.foldername(name))[1] = 'users' AND
    (storage.foldername(name))[2] = auth.uid()::text
  )
);

-- Policy: Admins can delete organization logos
CREATE POLICY "Admins can delete organization logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = 'organizations' AND
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.organization_id = (storage.foldername(name))[2]::uuid
    AND organization_members.user_id = auth.uid()
    AND organization_members.role = 'admin'
  )
);

-- =============================================================================
-- STORAGE MIGRATION COMPLETE
-- =============================================================================

-- File structure in storage:
-- avatars/
--   ├── users/
--   │   └── {user_id}/
--   │       └── avatar.jpg (or .png, .webp, etc.)
--   └── organizations/
--       └── {org_id}/
--           └── logo.jpg (or .png, .webp, etc.)
