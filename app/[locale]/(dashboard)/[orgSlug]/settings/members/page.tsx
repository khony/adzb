import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { getMembers, getInvitations } from '@/lib/actions/invitations'
import { MemberList } from '@/components/organizations/member-list'
import { InvitationList } from '@/components/organizations/invitation-list'
import { MembersPageClient } from '@/components/organizations/members-page-client'

export default async function MembersPage({
  params,
}: {
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

  // Get organization
  const { data: org } = await supabase
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

  if (!org) {
    notFound()
  }

  const userRole = org.organization_members[0]?.role
  const isAdmin = userRole === 'admin'

  const members = await getMembers(org.id)
  const invitations = isAdmin ? await getInvitations(org.id) : []

  return (
    <MembersPageClient
      organizationId={org.id}
      isAdmin={isAdmin}
      members={members}
      invitations={invitations}
      currentUserId={user.id}
    />
  )
}
