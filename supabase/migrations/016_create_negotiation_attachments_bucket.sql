-- =====================================================
-- CREATE NEGOTIATION ATTACHMENTS STORAGE BUCKET
-- =====================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'negotiation_attachments',
  'negotiation_attachments',
  false,
  52428800,
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];

-- =============================================================================
-- STORAGE POLICIES
-- =============================================================================

-- Policy: Organization members can read their attachments
CREATE POLICY "read_negotiation_attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'negotiation_attachments'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] IN (
    SELECT organization_id::text
    FROM organization_members
    WHERE user_id = auth.uid()
  )
);

-- Policy: Organization members can upload attachments
CREATE POLICY "upload_negotiation_attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'negotiation_attachments'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] IN (
    SELECT organization_id::text
    FROM organization_members
    WHERE user_id = auth.uid()
  )
);

-- Policy: Admins can delete attachments
CREATE POLICY "delete_negotiation_attachments_storage"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'negotiation_attachments'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] IN (
    SELECT organization_id::text
    FROM organization_members
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);
