-- =====================================================
-- INITIAL SCHEMA FOR MULTI-TENANT KEYWORDS APP
-- =====================================================

-- =============================================================================
-- 1. CREATE ENUMS
-- =============================================================================

CREATE TYPE IF NOT EXISTS member_role AS ENUM ('admin', 'member');
CREATE TYPE IF NOT EXISTS invitation_status AS ENUM ('pending', 'accepted', 'expired', 'revoked');

-- =============================================================================
-- 2. CREATE TABLES
-- =============================================================================

-- Table: profiles
-- Extends auth.users with additional user information
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Table: organizations (Tenants)
-- Each organization is a separate tenant with isolated data
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  avatar_url TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_created_by ON organizations(created_by);

-- Table: organization_members
-- Many-to-many relationship between users and organizations
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role member_role NOT NULL DEFAULT 'member',
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_org ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_role ON organization_members(organization_id, role);

-- Table: invitations
-- Manages pending invitations to organizations
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role member_role NOT NULL DEFAULT 'member',
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  status invitation_status NOT NULL DEFAULT 'pending',
  token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_invitations_org ON invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);

-- Table: keywords
-- Main functionality - keyword storage per organization
CREATE TABLE IF NOT EXISTS keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  description TEXT,
  category TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(organization_id, keyword)
);

CREATE INDEX IF NOT EXISTS idx_keywords_org ON keywords(organization_id);
CREATE INDEX IF NOT EXISTS idx_keywords_created_by ON keywords(created_by);
CREATE INDEX IF NOT EXISTS idx_keywords_category ON keywords(organization_id, category);

-- =============================================================================
-- 3. CREATE FUNCTIONS
-- =============================================================================

-- Function: update_updated_at_column
-- Automatically updates the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: handle_new_user
-- Automatically creates a profile when a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: create_organization_with_admin
-- Creates an organization and adds the creator as admin in a single transaction
CREATE OR REPLACE FUNCTION create_organization_with_admin(
  org_name TEXT,
  org_slug TEXT
)
RETURNS UUID AS $$
DECLARE
  new_org_id UUID;
BEGIN
  -- Create organization
  INSERT INTO organizations (name, slug, created_by)
  VALUES (org_name, org_slug, auth.uid())
  RETURNING id INTO new_org_id;

  -- Add creator as admin
  INSERT INTO organization_members (organization_id, user_id, role)
  VALUES (new_org_id, auth.uid(), 'admin');

  RETURN new_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: accept_invitation
-- Accepts an invitation and adds user to organization
CREATE OR REPLACE FUNCTION accept_invitation(invitation_token TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  inv_record RECORD;
  user_email TEXT;
BEGIN
  -- Get current user's email
  SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();

  -- Find matching invitation
  SELECT * INTO inv_record FROM invitations
  WHERE token = invitation_token
  AND email = user_email
  AND status = 'pending'
  AND expires_at > NOW();

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Add user to organization
  INSERT INTO organization_members (organization_id, user_id, role, invited_by)
  VALUES (inv_record.organization_id, auth.uid(), inv_record.role, inv_record.invited_by)
  ON CONFLICT (organization_id, user_id) DO NOTHING;

  -- Update invitation status
  UPDATE invitations
  SET status = 'accepted', accepted_at = NOW()
  WHERE id = inv_record.id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: expire_old_invitations
-- Marks expired invitations (to be run via cron)
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void AS $$
BEGIN
  UPDATE invitations
  SET status = 'expired'
  WHERE status = 'pending'
  AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 4. CREATE TRIGGERS
-- =============================================================================

-- Trigger: Auto-create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Trigger: Auto-update updated_at on profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Auto-update updated_at on organizations
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Auto-update updated_at on keywords
DROP TRIGGER IF EXISTS update_keywords_updated_at ON keywords;
CREATE TRIGGER update_keywords_updated_at
  BEFORE UPDATE ON keywords
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 5. ENABLE ROW LEVEL SECURITY (RLS)
-- =============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 6. CREATE RLS POLICIES - PROFILES
-- =============================================================================

-- Profiles: Users can view own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Profiles: Users can update own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Profiles: Enable insert for authenticated users
CREATE POLICY "Enable insert for authenticated users only"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =============================================================================
-- 7. CREATE RLS POLICIES - ORGANIZATIONS
-- =============================================================================

-- Organizations: Users can view organizations they belong to
CREATE POLICY "Users can view organizations they belong to"
  ON organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organizations.id
      AND organization_members.user_id = auth.uid()
    )
  );

-- Organizations: Admins can update their organizations
CREATE POLICY "Organization admins can update"
  ON organizations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organizations.id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'admin'
    )
  );

-- Organizations: Authenticated users can create organizations
CREATE POLICY "Authenticated users can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- =============================================================================
-- 8. CREATE RLS POLICIES - ORGANIZATION_MEMBERS
-- =============================================================================

-- Members: Can view other members in same organization
CREATE POLICY "Members can view organization members"
  ON organization_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
    )
  );

-- Members: Admins can add members
CREATE POLICY "Admins can insert members"
  ON organization_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role = 'admin'
    )
  );

-- Members: Admins can update member roles
CREATE POLICY "Admins can update members"
  ON organization_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role = 'admin'
    )
  );

-- Members: Admins can remove members (except themselves)
CREATE POLICY "Admins can delete members"
  ON organization_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role = 'admin'
      AND organization_members.user_id != auth.uid()
    )
  );

-- =============================================================================
-- 9. CREATE RLS POLICIES - INVITATIONS
-- =============================================================================

-- Invitations: Admins can view organization invitations
CREATE POLICY "Admins can view organization invitations"
  ON invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = invitations.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'admin'
    )
  );

-- Invitations: Users can view invitations sent to their email
CREATE POLICY "Users can view invitations sent to them"
  ON invitations FOR SELECT
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Invitations: Admins can create invitations
CREATE POLICY "Admins can create invitations"
  ON invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = invitations.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'admin'
    )
  );

-- Invitations: Admins can update (revoke) invitations
CREATE POLICY "Admins can update invitations"
  ON invitations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = invitations.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'admin'
    )
  );

-- Invitations: Users can accept their own invitations
CREATE POLICY "Users can accept their invitations"
  ON invitations FOR UPDATE
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND status = 'pending'
  );

-- =============================================================================
-- 10. CREATE RLS POLICIES - KEYWORDS
-- =============================================================================

-- Keywords: Members can view keywords in their organizations
CREATE POLICY "Members can view organization keywords"
  ON keywords FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = keywords.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- Keywords: Members can create keywords
CREATE POLICY "Members can create keywords"
  ON keywords FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = keywords.organization_id
      AND organization_members.user_id = auth.uid()
    )
    AND auth.uid() = created_by
  );

-- Keywords: Members can update keywords in their organization
CREATE POLICY "Members can update keywords"
  ON keywords FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = keywords.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- Keywords: Admins and creators can delete keywords
CREATE POLICY "Admins and creators can delete keywords"
  ON keywords FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = keywords.organization_id
      AND organization_members.user_id = auth.uid()
      AND (organization_members.role = 'admin' OR keywords.created_by = auth.uid())
    )
  );

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

-- Next steps:
-- 1. Configure Supabase Storage bucket for avatars (see migration 002)
-- 2. Disable email confirmation in Supabase Dashboard:
--    Authentication > Providers > Email > "Confirm email" = OFF
-- 3. Configure cron job to run expire_old_invitations() daily
