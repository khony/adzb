-- =====================================================
-- CREATE EVIDENCES SCREENSHOTS STORAGE BUCKET
-- =====================================================

-- Insert the bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'evidences_screenshots',
  'evidences_screenshots',
  true, -- Public bucket for easy access
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- =============================================================================
-- STORAGE POLICIES
-- =============================================================================

-- Policy: Allow public read access to all screenshots
CREATE POLICY "public_read_evidences_screenshots"
ON storage.objects FOR SELECT
USING (bucket_id = 'evidences_screenshots');

-- Policy: Allow authenticated users to upload screenshots
CREATE POLICY "authenticated_upload_evidences_screenshots"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'evidences_screenshots'
  AND auth.role() = 'authenticated'
);

-- Policy: Allow users to update their organization's screenshots
CREATE POLICY "users_update_own_org_evidences_screenshots"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'evidences_screenshots'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] IN (
    SELECT organization_id::text
    FROM organization_members
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'evidences_screenshots'
  AND auth.role() = 'authenticated'
);

-- Policy: Allow users to delete their organization's screenshots
CREATE POLICY "users_delete_own_org_evidences_screenshots"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'evidences_screenshots'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] IN (
    SELECT organization_id::text
    FROM organization_members
    WHERE user_id = auth.uid()
  )
);
