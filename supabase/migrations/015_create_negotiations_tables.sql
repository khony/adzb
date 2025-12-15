-- =====================================================
-- CREATE NEGOTIATIONS TABLES
-- =====================================================

-- =============================================================================
-- 1. CREATE UUIDv7 GENERATION FUNCTION
-- =============================================================================

-- UUIDv7 generates time-ordered UUIDs (RFC 9562)
CREATE OR REPLACE FUNCTION generate_uuidv7()
RETURNS UUID AS $$
DECLARE
  unix_ts_ms BIGINT;
  uuid_bytes BYTEA;
BEGIN
  unix_ts_ms := (EXTRACT(EPOCH FROM clock_timestamp()) * 1000)::BIGINT;

  -- Build 16 bytes: 6 bytes timestamp + 2 bytes random (with version) + 8 bytes random (with variant)
  uuid_bytes :=
    -- First 6 bytes: timestamp in milliseconds (big-endian)
    substring(int8send(unix_ts_ms) FROM 3 FOR 6)
    -- Next 2 bytes: 4 bits version (0111 = 7) + 12 bits random
    || set_bit(set_bit(gen_random_bytes(2), 15, 0), 14, 1)
    -- Next 8 bytes: 2 bits variant (10) + 62 bits random
    || set_bit(set_bit(gen_random_bytes(8), 63, 1), 62, 0);

  RETURN encode(uuid_bytes, 'hex')::UUID;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- =============================================================================
-- 2. CREATE NEGOTIATION STATUS ENUM
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE negotiation_status AS ENUM ('pending', 'resolved', 'unresolved');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =============================================================================
-- 3. CREATE NEGOTIATIONS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS negotiations (
  id UUID PRIMARY KEY DEFAULT generate_uuidv7(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  evidence_id UUID REFERENCES evidences(id) ON DELETE SET NULL,

  -- Content fields
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  recipients TEXT NOT NULL,

  -- Status
  status negotiation_status NOT NULL DEFAULT 'pending',

  -- Timestamps
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_interaction_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_negotiations_organization_id ON negotiations(organization_id);
CREATE INDEX IF NOT EXISTS idx_negotiations_evidence_id ON negotiations(evidence_id);
CREATE INDEX IF NOT EXISTS idx_negotiations_status ON negotiations(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_negotiations_created_at ON negotiations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_negotiations_last_interaction ON negotiations(last_interaction_at DESC);

-- =============================================================================
-- 4. CREATE NEGOTIATION ATTACHMENTS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS negotiation_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  negotiation_id UUID NOT NULL REFERENCES negotiations(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_negotiation_attachments_negotiation_id ON negotiation_attachments(negotiation_id);

-- =============================================================================
-- 5. TRIGGER FOR UPDATED_AT
-- =============================================================================

CREATE TRIGGER update_negotiations_updated_at
  BEFORE UPDATE ON negotiations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 6. ENABLE ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE negotiations ENABLE ROW LEVEL SECURITY;
ALTER TABLE negotiation_attachments ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 7. RLS POLICIES - NEGOTIATIONS
-- =============================================================================

-- Policy: Members can view negotiations of their organization
CREATE POLICY "view_negotiations" ON negotiations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = negotiations.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- Policy: Members can create negotiations
CREATE POLICY "create_negotiations" ON negotiations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = negotiations.organization_id
      AND organization_members.user_id = auth.uid()
    )
    AND auth.uid() = created_by
  );

-- Policy: Members can update negotiations in their organization
CREATE POLICY "update_negotiations" ON negotiations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = negotiations.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- Policy: Admins and creators can delete negotiations
CREATE POLICY "delete_negotiations" ON negotiations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = negotiations.organization_id
      AND organization_members.user_id = auth.uid()
      AND (organization_members.role = 'admin' OR negotiations.created_by = auth.uid())
    )
  );

-- =============================================================================
-- 8. RLS POLICIES - ATTACHMENTS
-- =============================================================================

-- Policy: Members can view attachments
CREATE POLICY "view_negotiation_attachments" ON negotiation_attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM negotiations
      JOIN organization_members ON organization_members.organization_id = negotiations.organization_id
      WHERE organization_members.user_id = auth.uid()
      AND negotiations.id = negotiation_attachments.negotiation_id
    )
  );

-- Policy: Members can insert attachments
CREATE POLICY "create_negotiation_attachments" ON negotiation_attachments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM negotiations
      JOIN organization_members ON organization_members.organization_id = negotiations.organization_id
      WHERE organization_members.user_id = auth.uid()
      AND negotiations.id = negotiation_attachments.negotiation_id
    )
  );

-- Policy: Uploaders and admins can delete attachments
CREATE POLICY "delete_negotiation_attachments" ON negotiation_attachments
  FOR DELETE USING (
    uploaded_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM negotiations
      JOIN organization_members ON organization_members.organization_id = negotiations.organization_id
      WHERE organization_members.user_id = auth.uid()
      AND organization_members.role = 'admin'
      AND negotiations.id = negotiation_attachments.negotiation_id
    )
  );

-- =============================================================================
-- 9. ENABLE REALTIME
-- =============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE negotiations;
ALTER PUBLICATION supabase_realtime ADD TABLE negotiation_attachments;
