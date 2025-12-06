'use server'

import { createClient } from '@/lib/supabase/server'
import { keywordSchema } from '@/lib/validations/keyword'
import { revalidatePath } from 'next/cache'

type ActionResult = {
  error?: string
  success?: boolean
  data?: any
}

export async function createKeyword(
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

  const validatedFields = keywordSchema.safeParse({
    keyword: formData.get('keyword'),
    description: formData.get('description'),
    category: formData.get('category'),
  })

  if (!validatedFields.success) {
    return { error: 'Dados inválidos' }
  }

  const { keyword, description, category } = validatedFields.data

  const { error, data } = await supabase
    .from('keywords')
    .insert({
      organization_id: organizationId,
      keyword,
      description: description || null,
      category: category || null,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      // Unique constraint violation
      return { error: 'Esta keyword já existe nesta organização' }
    }
    return { error: error.message }
  }

  revalidatePath('/[orgSlug]/keywords')

  return { success: true, data }
}

export async function updateKeyword(
  keywordId: string,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Não autenticado' }
  }

  // Get keyword to verify organization membership
  const { data: keyword } = await supabase
    .from('keywords')
    .select('organization_id')
    .eq('id', keywordId)
    .single()

  if (!keyword) {
    return { error: 'Keyword não encontrada' }
  }

  // Verify user is a member of the organization
  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', keyword.organization_id)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return { error: 'Sem permissão' }
  }

  const validatedFields = keywordSchema.safeParse({
    keyword: formData.get('keyword'),
    description: formData.get('description'),
    category: formData.get('category'),
  })

  if (!validatedFields.success) {
    return { error: 'Dados inválidos' }
  }

  const updates = validatedFields.data

  const { error } = await supabase
    .from('keywords')
    .update({
      keyword: updates.keyword,
      description: updates.description || null,
      category: updates.category || null,
    })
    .eq('id', keywordId)

  if (error) {
    if (error.code === '23505') {
      return { error: 'Esta keyword já existe nesta organização' }
    }
    return { error: error.message }
  }

  revalidatePath('/[orgSlug]/keywords')

  return { success: true }
}

export async function deleteKeyword(keywordId: string): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Não autenticado' }
  }

  // Get keyword to verify organization membership and creator
  const { data: keyword } = await supabase
    .from('keywords')
    .select('organization_id, created_by')
    .eq('id', keywordId)
    .single()

  if (!keyword) {
    return { error: 'Keyword não encontrada' }
  }

  // Verify user is admin or creator
  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', keyword.organization_id)
    .eq('user_id', user.id)
    .single()

  if (!membership || (membership.role !== 'admin' && keyword.created_by !== user.id)) {
    return { error: 'Sem permissão' }
  }

  const { error } = await supabase.from('keywords').delete().eq('id', keywordId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/[orgSlug]/keywords')

  return { success: true }
}

export async function getKeywords(organizationId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('keywords')
    .select(
      `
      *,
      creator:profiles!created_by(full_name, email)
    `
    )
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching keywords:', error)
    return []
  }

  return data || []
}
