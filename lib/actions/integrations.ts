'use server'

import { createClient } from '@/lib/supabase/server'
import type { IntegrationProvider, Integration } from '@/lib/types'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!
const GOOGLE_REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL + '/api/integrations/google/callback'

// Google Search Console API scope
const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/webmasters.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
].join(' ')

interface ActionResult<T = void> {
  data?: T
  error?: string
}

export async function getIntegration(
  organizationId: string,
  provider: IntegrationProvider
): Promise<ActionResult<Integration | null>> {
  const supabase = await createClient()

  const { data: integration, error } = await supabase
    .from('integrations')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('provider', provider)
    .single()

  if (error && error.code !== 'PGRST116') {
    return { error: error.message }
  }

  return { data: integration as Integration | null }
}

export async function generateGoogleAuthUrl(
  organizationId: string,
  provider: IntegrationProvider
): Promise<ActionResult<string>> {
  const supabase = await createClient()

  // Verify user is admin of the organization
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Usuario nao autenticado' }
  }

  const { data: member } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .single()

  if (!member || member.role !== 'admin') {
    return { error: 'Apenas administradores podem conectar integracoes' }
  }

  // Create state parameter with organization and provider info
  const state = Buffer.from(
    JSON.stringify({ organizationId, provider })
  ).toString('base64')

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: GOOGLE_SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    state,
  })

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`

  return { data: authUrl }
}

export async function exchangeGoogleCode(
  code: string,
  state: string
): Promise<ActionResult<Integration>> {
  const supabase = await createClient()

  // Decode state
  let stateData: { organizationId: string; provider: IntegrationProvider }
  try {
    stateData = JSON.parse(Buffer.from(state, 'base64').toString())
  } catch {
    return { error: 'Estado invalido' }
  }

  const { organizationId, provider } = stateData

  // Verify user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Usuario nao autenticado' }
  }

  const { data: member } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .single()

  if (!member || member.role !== 'admin') {
    return { error: 'Apenas administradores podem conectar integracoes' }
  }

  // Exchange code for tokens
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: GOOGLE_REDIRECT_URI,
    }),
  })

  const tokenData = await tokenResponse.json()

  if (tokenData.error) {
    return { error: tokenData.error_description || 'Erro ao obter tokens' }
  }

  // Get user info from Google
  const userInfoResponse = await fetch(
    'https://www.googleapis.com/oauth2/v2/userinfo',
    {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    }
  )

  const userInfo = await userInfoResponse.json()

  // Calculate token expiration
  const tokenExpiresAt = new Date(
    Date.now() + tokenData.expires_in * 1000
  ).toISOString()

  // Upsert integration
  const { data: integration, error } = await supabase
    .from('integrations')
    .upsert(
      {
        organization_id: organizationId,
        provider,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_expires_at: tokenExpiresAt,
        account_id: userInfo.id,
        account_email: userInfo.email,
        account_name: userInfo.name,
        is_active: true,
        connected_by: user.id,
      },
      {
        onConflict: 'organization_id,provider',
      }
    )
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  return { data: integration as Integration }
}

export async function disconnectIntegration(
  organizationId: string,
  provider: IntegrationProvider
): Promise<ActionResult> {
  const supabase = await createClient()

  // Verify user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Usuario nao autenticado' }
  }

  const { data: member } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .single()

  if (!member || member.role !== 'admin') {
    return { error: 'Apenas administradores podem desconectar integracoes' }
  }

  const { error } = await supabase
    .from('integrations')
    .delete()
    .eq('organization_id', organizationId)
    .eq('provider', provider)

  if (error) {
    return { error: error.message }
  }

  return {}
}

export async function refreshGoogleToken(
  integrationId: string
): Promise<ActionResult<{ access_token: string; expires_at: string }>> {
  const supabase = await createClient()

  // Get current integration
  const { data: integration, error: fetchError } = await supabase
    .from('integrations')
    .select('*')
    .eq('id', integrationId)
    .single()

  if (fetchError || !integration) {
    return { error: 'Integracao nao encontrada' }
  }

  if (!integration.refresh_token) {
    return { error: 'Refresh token nao disponivel' }
  }

  // Refresh the token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: integration.refresh_token,
      grant_type: 'refresh_token',
    }),
  })

  const tokenData = await tokenResponse.json()

  if (tokenData.error) {
    return { error: tokenData.error_description || 'Erro ao renovar token' }
  }

  const tokenExpiresAt = new Date(
    Date.now() + tokenData.expires_in * 1000
  ).toISOString()

  // Update integration with new token
  const { error: updateError } = await supabase
    .from('integrations')
    .update({
      access_token: tokenData.access_token,
      token_expires_at: tokenExpiresAt,
    })
    .eq('id', integrationId)

  if (updateError) {
    return { error: updateError.message }
  }

  return {
    data: {
      access_token: tokenData.access_token,
      expires_at: tokenExpiresAt,
    },
  }
}
