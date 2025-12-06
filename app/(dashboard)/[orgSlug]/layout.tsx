import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { SetActiveOrg } from '@/components/providers/set-active-org'

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    notFound()
  }

  // Get organization by slug and verify user is a member
  const { data: org, error } = await supabase
    .from('organizations')
    .select(
      `
      *,
      organization_members!inner(role)
    `
    )
    .eq('slug', orgSlug)
    .eq('organization_members.user_id', user.id)
    .single()

  if (error || !org) {
    notFound()
  }

  const organization = {
    ...org,
    userRole: org.organization_members[0]?.role,
  }

  return (
    <SetActiveOrg organization={organization}>
      {children}
    </SetActiveOrg>
  )
}
