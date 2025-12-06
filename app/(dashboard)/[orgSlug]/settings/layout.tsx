import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const settingsNav = [
  {
    title: 'Geral',
    href: '/settings/general',
  },
  {
    title: 'Membros',
    href: '/settings/members',
  },
]

export default async function SettingsLayout({
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

  return (
    <div className="container py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie as configurações da sua organização
        </p>
      </div>

      <div className="flex gap-6">
        <aside className="w-48 shrink-0">
          <nav className="space-y-1">
            {settingsNav.map((item) => (
              <Button
                key={item.href}
                asChild
                variant="ghost"
                className="w-full justify-start"
              >
                <Link href={`/${orgSlug}${item.href}`}>{item.title}</Link>
              </Button>
            ))}
          </nav>
        </aside>

        <div className="flex-1">{children}</div>
      </div>
    </div>
  )
}
