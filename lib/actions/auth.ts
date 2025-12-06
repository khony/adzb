'use server'

import { createClient } from '@/lib/supabase/server'
import { loginSchema, registerSchema } from '@/lib/validations/auth'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

type ActionResult = {
  error?: string
  success?: boolean
}

export async function loginUser(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  const validatedFields = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!validatedFields.success) {
    return { error: 'Dados inválidos' }
  }

  const { email, password } = validatedFields.data

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  // Check if user has an organization
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Erro ao obter usuário' }
  }

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id, organizations(slug)')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  if (membership && membership.organizations) {
    const orgs = Array.isArray(membership.organizations)
      ? membership.organizations[0]
      : membership.organizations
    redirect(`/${orgs.slug}/keywords`)
  } else {
    redirect('/onboarding')
  }
}

export async function registerUser(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  const validatedFields = registerSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    fullName: formData.get('fullName'),
  })

  if (!validatedFields.success) {
    return { error: 'Dados inválidos' }
  }

  const { email, password, fullName } = validatedFields.data

  const origin = (await headers()).get('origin')

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  // Redirect to onboarding to create first organization
  redirect('/onboarding')
}

export async function logoutUser(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
