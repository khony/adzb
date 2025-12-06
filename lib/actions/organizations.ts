'use server'

import { createClient } from '@/lib/supabase/server'
import { createOrgSchema, updateOrgSchema } from '@/lib/validations/organization'
import { slugify } from '@/lib/utils/slugify'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

type ActionResult = {
  error?: string
  success?: boolean
  data?: any
}

export async function createOrganization(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Não autenticado' }
  }

  const validatedFields = createOrgSchema.safeParse({
    name: formData.get('name'),
  })

  if (!validatedFields.success) {
    return { error: 'Dados inválidos' }
  }

  const { name } = validatedFields.data
  let slug = slugify(name)

  // Check if slug already exists and make it unique
  const { data: existing } = await supabase
    .from('organizations')
    .select('slug')
    .eq('slug', slug)
    .single()

  if (existing) {
    // Add random suffix to make slug unique
    slug = `${slug}-${Math.random().toString(36).substring(2, 8)}`
  }

  // Use PostgreSQL function to create org and add user as admin
  const { data, error } = await supabase.rpc('create_organization_with_admin', {
    org_name: name,
    org_slug: slug,
  })

  if (error) {
    console.error('Error creating organization:', error)
    return { error: error.message || 'Erro ao criar organização' }
  }

  // Redirect to the new organization's keywords page
  redirect(`/${slug}/keywords`)
}

export async function updateOrganization(
  orgId: string,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Não autenticado' }
  }

  // Check if user is admin of this organization
  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', orgId)
    .eq('user_id', user.id)
    .single()

  if (!membership || membership.role !== 'admin') {
    return { error: 'Sem permissão' }
  }

  const validatedFields = updateOrgSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
  })

  if (!validatedFields.success) {
    return { error: 'Dados inválidos' }
  }

  const updates: any = {}
  if (validatedFields.data.name) {
    updates.name = validatedFields.data.name
  }
  if (validatedFields.data.description !== undefined) {
    updates.description = validatedFields.data.description
  }

  const { error } = await supabase
    .from('organizations')
    .update(updates)
    .eq('id', orgId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/[orgSlug]/settings`)

  return { success: true }
}

export async function getOrganizations() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from('organization_members')
    .select(
      `
      role,
      organization:organizations(
        id,
        name,
        slug,
        description,
        avatar_url,
        created_at
      )
    `
    )
    .eq('user_id', user.id)

  if (error) {
    console.error('Error fetching organizations:', error)
    return []
  }

  return (
    data
      ?.map((item) => ({
        ...item.organization,
        userRole: item.role,
      }))
      .filter(Boolean) || []
  )
}

export async function getOrganizationBySlug(slug: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data, error } = await supabase
    .from('organizations')
    .select(
      `
      *,
      organization_members!inner(role)
    `
    )
    .eq('slug', slug)
    .eq('organization_members.user_id', user.id)
    .single()

  if (error) {
    return null
  }

  return {
    ...data,
    userRole: data.organization_members[0]?.role,
  }
}
