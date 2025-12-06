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
