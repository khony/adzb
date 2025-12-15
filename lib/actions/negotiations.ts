'use server'

import { createClient } from '@/lib/supabase/server'
import { negotiationSchema, updateNegotiationSchema } from '@/lib/validations/negotiation'
import { revalidatePath } from 'next/cache'
import type { NegotiationStatus } from '@/lib/types'

type ActionResult = {
  error?: string
  success?: boolean
  data?: any
}

export async function createNegotiation(
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

  // Verify user is a member of the organization
  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return { error: 'Sem permissão' }
  }

  const evidenceId = formData.get('evidence_id')

  const validatedFields = negotiationSchema.safeParse({
    subject: formData.get('subject'),
    content: formData.get('content'),
    recipients: formData.get('recipients'),
    evidence_id: evidenceId === '' ? null : evidenceId,
  })

  if (!validatedFields.success) {
    return { error: validatedFields.error.issues[0]?.message || 'Dados inválidos' }
  }

  const { subject, content, recipients, evidence_id } = validatedFields.data

  const { error, data } = await supabase
    .from('negotiations')
    .insert({
      organization_id: organizationId,
      subject,
      content,
      recipients,
      evidence_id: evidence_id || null,
      status: 'pending',
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/[orgSlug]/negotiations')

  return { success: true, data }
}

export async function updateNegotiation(
  negotiationId: string,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Não autenticado' }
  }

  // Get negotiation to verify organization membership
  const { data: negotiation } = await supabase
    .from('negotiations')
    .select('organization_id')
    .eq('id', negotiationId)
    .single()

  if (!negotiation) {
    return { error: 'Negociação não encontrada' }
  }

  // Verify user is a member of the organization
  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', negotiation.organization_id)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return { error: 'Sem permissão' }
  }

  const evidenceId = formData.get('evidence_id')

  const validatedFields = updateNegotiationSchema.safeParse({
    subject: formData.get('subject') || undefined,
    content: formData.get('content') || undefined,
    recipients: formData.get('recipients') || undefined,
    evidence_id: evidenceId === '' ? null : evidenceId || undefined,
    status: formData.get('status') || undefined,
  })

  if (!validatedFields.success) {
    return { error: validatedFields.error.issues[0]?.message || 'Dados inválidos' }
  }

  const updates: Record<string, any> = {}
  if (validatedFields.data.subject) updates.subject = validatedFields.data.subject
  if (validatedFields.data.content) updates.content = validatedFields.data.content
  if (validatedFields.data.recipients) updates.recipients = validatedFields.data.recipients
  if (validatedFields.data.evidence_id !== undefined) {
    updates.evidence_id = validatedFields.data.evidence_id
  }
  if (validatedFields.data.status) {
    updates.status = validatedFields.data.status
    updates.last_interaction_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('negotiations')
    .update(updates)
    .eq('id', negotiationId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/[orgSlug]/negotiations')

  return { success: true }
}

export async function deleteNegotiation(negotiationId: string): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Não autenticado' }
  }

  // Get negotiation to verify permissions
  const { data: negotiation } = await supabase
    .from('negotiations')
    .select('organization_id, created_by')
    .eq('id', negotiationId)
    .single()

  if (!negotiation) {
    return { error: 'Negociação não encontrada' }
  }

  // Verify user is admin or creator
  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', negotiation.organization_id)
    .eq('user_id', user.id)
    .single()

  if (!membership || (membership.role !== 'admin' && negotiation.created_by !== user.id)) {
    return { error: 'Sem permissão' }
  }

  const { error } = await supabase.from('negotiations').delete().eq('id', negotiationId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/[orgSlug]/negotiations')

  return { success: true }
}

export async function updateNegotiationStatus(
  negotiationId: string,
  status: NegotiationStatus
): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Não autenticado' }
  }

  // Get negotiation to verify organization membership
  const { data: negotiation } = await supabase
    .from('negotiations')
    .select('organization_id')
    .eq('id', negotiationId)
    .single()

  if (!negotiation) {
    return { error: 'Negociação não encontrada' }
  }

  // Verify user is a member
  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', negotiation.organization_id)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return { error: 'Sem permissão' }
  }

  const { error } = await supabase
    .from('negotiations')
    .update({
      status,
      last_interaction_at: new Date().toISOString(),
    })
    .eq('id', negotiationId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/[orgSlug]/negotiations')

  return { success: true }
}

export async function getNegotiations(organizationId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('negotiations')
    .select(
      `
      *,
      evidences(
        id,
        detected_at,
        keywords(keyword)
      )
    `
    )
    .eq('organization_id', organizationId)
    .order('last_interaction_at', { ascending: false })

  if (error) {
    console.error('Error fetching negotiations:', error)
    return []
  }

  return (
    data?.map((item: any) => ({
      ...item,
      evidence: Array.isArray(item.evidences) ? item.evidences[0] : item.evidences,
    })) || []
  )
}
