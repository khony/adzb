import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { AcceptInvitationButton } from '@/components/organizations/accept-invitation-button'

export default async function InvitationPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // Redirect to login with return URL
    redirect(`/login?redirect=/invitations/${token}`)
  }

  // Get invitation details
  const { data: invitation } = await supabase
    .from('invitations')
    .select(
      `
      *,
      organization:organizations(name, slug),
      inviter:profiles!invited_by(full_name, email)
    `
    )
    .eq('token', token)
    .eq('status', 'pending')
    .single()

  if (!invitation || new Date(invitation.expires_at) < new Date()) {
    notFound()
  }

  // Check if user email matches invitation
  if (invitation.email.toLowerCase() !== user.email?.toLowerCase()) {
    return (
      <div className="container flex min-h-screen items-center justify-center">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold">Convite Inválido</h1>
          <p className="mt-2 text-muted-foreground">
            Este convite foi enviado para {invitation.email}, mas você está logado como{' '}
            {user.email}.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Por favor, faça logout e login com o email correto para aceitar este convite.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container flex min-h-screen items-center justify-center">
      <div className="max-w-md space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Você foi convidado!</h1>
          <p className="text-muted-foreground">
            {invitation.inviter?.full_name || invitation.inviter?.email} convidou você para se
            juntar a <strong>{invitation.organization?.name}</strong> como{' '}
            <strong>{invitation.role}</strong>.
          </p>
        </div>

        <AcceptInvitationButton token={token} organizationSlug={invitation.organization?.slug} />
      </div>
    </div>
  )
}
