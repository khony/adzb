'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

type ActionResult = {
  error?: string
  success?: boolean
}

export async function updateProfile(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Não autenticado' }
  }

  const fullName = formData.get('fullName') as string
  const avatarUrl = formData.get('avatarUrl') as string

  const updates: any = {}
  if (fullName) updates.full_name = fullName
  if (avatarUrl) updates.avatar_url = avatarUrl

  const { error } = await supabase.from('profiles').update(updates).eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/profile')
  revalidatePath('/[orgSlug]')

  return { success: true }
}

export async function updateOrganizationSettings(
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

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const avatarUrl = formData.get('avatarUrl') as string

  const updates: any = {}
  if (name) updates.name = name
  if (description !== undefined) updates.description = description || null
  if (avatarUrl) updates.avatar_url = avatarUrl

  const { error } = await supabase
    .from('organizations')
    .update(updates)
    .eq('id', organizationId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/[orgSlug]/settings')

  return { success: true }
}
