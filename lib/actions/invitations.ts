'use server'

import { createClient } from '@/lib/supabase/server'
import { inviteSchema } from '@/lib/validations/invitation'
import { revalidatePath } from 'next/cache'

type ActionResult = {
  error?: string
  success?: boolean
  data?: any
}

export async function createInvitation(
  organizationId: string,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Não autenticado' }
  }

  // Verify user is admin of the organization
  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .single()

  if (!membership || membership.role !== 'admin') {
    return { error: 'Apenas admins podem convidar membros' }
  }

  const validatedFields = inviteSchema.safeParse({
    email: formData.get('email'),
    role: formData.get('role'),
  })

  if (!validatedFields.success) {
    return { error: 'Dados inválidos' }
  }

  const { email, role } = validatedFields.data

  // Check if user is already a member
  const { data: existingMember } = await supabase
    .from('organization_members')
    .select('id, profiles!user_id(email)')
    .eq('organization_id', organizationId)

  const isMember = existingMember?.some(
    (m: any) => m.profiles?.email?.toLowerCase() === email.toLowerCase()
  )

  if (isMember) {
    return { error: 'Este usuário já é membro da organização' }
  }

  // Check if there's already a pending invitation
  const { data: existingInvite } = await supabase
    .from('invitations')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('email', email)
    .eq('status', 'pending')
    .single()

  if (existingInvite) {
    return { error: 'Já existe um convite pendente para este email' }
  }

  // Create invitation
  const { data: invitation, error } = await supabase
    .from('invitations')
    .insert({
      organization_id: organizationId,
      email,
      role,
      invited_by: user.id,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/[orgSlug]/settings/members')

  return { success: true, data: invitation }
}

export async function revokeInvitation(invitationId: string): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Não autenticado' }
  }

  // Get invitation to verify organization membership
  const { data: invitation } = await supabase
    .from('invitations')
    .select('organization_id')
    .eq('id', invitationId)
    .single()

  if (!invitation) {
    return { error: 'Convite não encontrado' }
  }

  // Verify user is admin
  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', invitation.organization_id)
    .eq('user_id', user.id)
    .single()

  if (!membership || membership.role !== 'admin') {
    return { error: 'Sem permissão' }
  }

  const { error } = await supabase
    .from('invitations')
    .update({ status: 'revoked' })
    .eq('id', invitationId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/[orgSlug]/settings/members')

  return { success: true }
}

export async function acceptInvitation(token: string): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Não autenticado' }
  }

  // Use PostgreSQL function to accept invitation
  const { data: success, error } = await supabase.rpc('accept_invitation', {
    invitation_token: token,
  })

  if (error || !success) {
    return { error: error?.message || 'Erro ao aceitar convite' }
  }

  // Get organization slug to redirect
  const { data: invitation } = await supabase
    .from('invitations')
    .select('organization:organizations(slug)')
    .eq('token', token)
    .single()

  const org = Array.isArray(invitation?.organization)
    ? invitation?.organization[0]
    : invitation?.organization

  return {
    success: true,
    data: { slug: org?.slug },
  }
}

export async function getInvitations(organizationId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching invitations:', error)
    return []
  }

  return data || []
}

export async function getMembers(organizationId: string) {
  const supabase = await createClient()

  // Use PostgreSQL function to fetch members with profiles
  // This bypasses RLS issues
  const { data, error } = await supabase.rpc('get_organization_members', {
    org_id: organizationId,
  })

  if (error) {
    console.error('Error fetching members:', error)
    return []
  }

  // Transform the flat structure back to nested structure
  const members = (data || []).map((row: any) => ({
    id: row.id,
    organization_id: row.organization_id,
    user_id: row.user_id,
    role: row.role,
    invited_by: row.invited_by,
    joined_at: row.joined_at,
    profile: {
      id: row.profile_id,
      email: row.profile_email,
      full_name: row.profile_full_name,
      avatar_url: row.profile_avatar_url,
      created_at: row.profile_created_at,
      updated_at: row.profile_updated_at,
    },
  }))

  return members
}

export async function removeMember(
  organizationId: string,
  userId: string
): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Não autenticado' }
  }

  // Cannot remove yourself
  if (userId === user.id) {
    return { error: 'Você não pode se remover da organização' }
  }

  // Verify user is admin
  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .single()

  if (!membership || membership.role !== 'admin') {
    return { error: 'Sem permissão' }
  }

  const { error } = await supabase
    .from('organization_members')
    .delete()
    .eq('organization_id', organizationId)
    .eq('user_id', userId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/[orgSlug]/settings/members')

  return { success: true }
}
