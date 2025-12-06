-- =====================================================
-- CREATE EVIDENCES TABLES
-- =====================================================

-- Table: evidences
-- Stores evidence records for each keyword monitoring
CREATE TABLE IF NOT EXISTS evidences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  keyword_id UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,

  -- Type of evidence
  is_positive BOOLEAN NOT NULL DEFAULT false,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Unique constraint to prevent duplicate evidences for same keyword at same time
  UNIQUE(organization_id, keyword_id, detected_at)
);

CREATE INDEX IF NOT EXISTS idx_evidences_organization_id ON evidences(organization_id);
CREATE INDEX IF NOT EXISTS idx_evidences_keyword_id ON evidences(keyword_id);
CREATE INDEX IF NOT EXISTS idx_evidences_detected_at ON evidences(detected_at DESC);

-- Table: evidence_domains
-- Stores domains that reference the keyword (for negative evidences)
CREATE TABLE IF NOT EXISTS evidence_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id UUID NOT NULL REFERENCES evidences(id) ON DELETE CASCADE,
  domain VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evidence_domains_evidence_id ON evidence_domains(evidence_id);

-- Table: evidence_screenshots
-- Stores screenshots from different search engines
CREATE TABLE IF NOT EXISTS evidence_screenshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id UUID NOT NULL REFERENCES evidences(id) ON DELETE CASCADE,
  engine VARCHAR(50) NOT NULL, -- 'google', 'yahoo', 'bing', 'meta'
  file_path VARCHAR(500), -- Path in Supabase Storage (optional)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evidence_screenshots_evidence_id ON evidence_screenshots(evidence_id);
CREATE INDEX IF NOT EXISTS idx_evidence_screenshots_engine ON evidence_screenshots(engine);

-- =============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- =============================================================================

ALTER TABLE evidences ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_screenshots ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

-- Policy: Users can view evidences of their organization
CREATE POLICY "view_evidences" ON evidences
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = evidences.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- Policy: Users can view evidence domains
CREATE POLICY "view_evidence_domains" ON evidence_domains
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM evidences
      JOIN organization_members ON organization_members.organization_id = evidences.organization_id
      WHERE organization_members.user_id = auth.uid()
      AND evidences.id = evidence_domains.evidence_id
    )
  );

-- Policy: Users can view evidence screenshots
CREATE POLICY "view_evidence_screenshots" ON evidence_screenshots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM evidences
      JOIN organization_members ON organization_members.organization_id = evidences.organization_id
      WHERE organization_members.user_id = auth.uid()
      AND evidences.id = evidence_screenshots.evidence_id
    )
  );

-- =============================================================================
-- ENABLE REALTIME
-- =============================================================================

-- Add evidences table to Realtime publication for real-time updates
ALTER PUBLICATION supabase_realtime ADD TABLE evidences;
ALTER PUBLICATION supabase_realtime ADD TABLE evidence_domains;
ALTER PUBLICATION supabase_realtime ADD TABLE evidence_screenshots;
