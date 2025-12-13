export type Organization = {
  id: string
  name: string
  slug: string
  description: string | null
  avatar_url: string | null
  created_by: string
  created_at: string
  updated_at: string
  userRole?: 'admin' | 'member'
}

export type Profile = {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export type Keyword = {
  id: string
  organization_id: string
  keyword: string
  description: string | null
  category: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export type OrganizationMember = {
  id: string
  organization_id: string
  user_id: string
  role: 'admin' | 'member'
  invited_by: string | null
  joined_at: string
  profile?: Profile
}

export type Invitation = {
  id: string
  organization_id: string
  email: string
  role: 'admin' | 'member'
  invited_by: string
  status: 'pending' | 'accepted' | 'expired' | 'revoked'
  token: string
  expires_at: string
  created_at: string
  accepted_at: string | null
}

export type Evidence = {
  id: string
  organization_id: string
  keyword_id: string
  is_positive: boolean
  created_at: string
  detected_at: string
}

export type EvidenceDomain = {
  id: string
  evidence_id: string
  domain: string
  created_at: string
}

export type EvidenceScreenshot = {
  id: string
  evidence_id: string
  engine: 'google' | 'yahoo' | 'bing' | 'meta'
  file_path: string | null
  created_at: string
}

export type EvidenceDetail = Evidence & {
  keyword?: Keyword
  domains: EvidenceDomain[]
  screenshots: EvidenceScreenshot[]
}

export type IntegrationProvider =
  | 'google_search_console'
  | 'google_ads'
  | 'meta_ads'
  | 'bing_ads'

export type Integration = {
  id: string
  organization_id: string
  provider: IntegrationProvider
  access_token: string | null
  refresh_token: string | null
  token_expires_at: string | null
  account_id: string | null
  account_email: string | null
  account_name: string | null
  is_active: boolean
  settings: Record<string, unknown>
  connected_by: string | null
  created_at: string
  updated_at: string
}
