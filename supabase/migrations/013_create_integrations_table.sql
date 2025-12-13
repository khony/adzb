-- Create integrations table to store OAuth tokens and connection data
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- 'google_search_console', 'google_ads', 'meta_ads', 'bing_ads'
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  account_id VARCHAR(255), -- External account identifier
  account_email VARCHAR(255), -- Email associated with the connected account
  account_name VARCHAR(255), -- Display name of the connected account
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}', -- Additional provider-specific settings
  connected_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure only one active integration per provider per organization
  UNIQUE(organization_id, provider)
);

-- Create index for faster lookups
CREATE INDEX idx_integrations_org_provider ON integrations(organization_id, provider);

-- Enable RLS
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Members can view integrations of their organization
CREATE POLICY "Members can view organization integrations"
  ON integrations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = integrations.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- Only admins can insert integrations
CREATE POLICY "Admins can insert integrations"
  ON integrations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = integrations.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'admin'
    )
  );

-- Only admins can update integrations
CREATE POLICY "Admins can update integrations"
  ON integrations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = integrations.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'admin'
    )
  );

-- Only admins can delete integrations
CREATE POLICY "Admins can delete integrations"
  ON integrations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = integrations.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'admin'
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER integrations_updated_at
  BEFORE UPDATE ON integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_integrations_updated_at();
