import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { OrgSettingsForm } from '@/components/organizations/org-settings-form'

export default async function GeneralSettingsPage({
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
    .select('*')
    .eq('slug', orgSlug)
    .single()

  if (!org) {
    notFound()
  }

  // Check user role
  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', org.id)
    .eq('user_id', user.id)
    .single()

  const isAdmin = membership?.role === 'admin'

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Configurações Gerais</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie as informações básicas da sua organização
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>
              Apenas administradores podem editar as configurações da organização
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Configurações Gerais</h2>
        <p className="text-sm text-muted-foreground">
          Gerencie as informações básicas da sua organização
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações da Organização</CardTitle>
          <CardDescription>
            Atualize o logo e as informações da sua organização
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrgSettingsForm organization={org} />
        </CardContent>
      </Card>
    </div>
  )
}
