'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useActiveOrg } from '@/contexts/active-org-context'
import { LayoutDashboard, Key, Settings, Users, Plug, Eye, Handshake } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function SidebarNav() {
  const pathname = usePathname()
  const { activeOrg } = useActiveOrg()

  if (!activeOrg) {
    return null
  }

  const routes = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      href: `/${activeOrg.slug}/dashboard`,
      active: pathname === `/${activeOrg.slug}/dashboard` || pathname.startsWith(`/${activeOrg.slug}/dashboard`),
    },
    {
      label: 'Palavras-chave',
      icon: Key,
      href: `/${activeOrg.slug}/keywords`,
      active: pathname === `/${activeOrg.slug}/keywords` || pathname.startsWith(`/${activeOrg.slug}/keywords`),
    },
    {
      label: 'Evidências',
      icon: Eye,
      href: `/${activeOrg.slug}/evidences`,
      active: pathname === `/${activeOrg.slug}/evidences` || pathname.startsWith(`/${activeOrg.slug}/evidences`),
    },
    {
      label: 'Negociações',
      icon: Handshake,
      href: `/${activeOrg.slug}/negotiations`,
      active: pathname === `/${activeOrg.slug}/negotiations` || pathname.startsWith(`/${activeOrg.slug}/negotiations`),
    },
    {
      label: 'Integrações',
      icon: Plug,
      href: `/${activeOrg.slug}/integrations`,
      active: pathname === `/${activeOrg.slug}/integrations` || pathname.startsWith(`/${activeOrg.slug}/integrations`),
    },
    {
      label: 'Configurações',
      icon: Settings,
      href: `/${activeOrg.slug}/settings/general`,
      active: pathname.startsWith(`/${activeOrg.slug}/settings`),
    },
  ]

  return (
    <nav className="flex flex-col gap-1">
      {routes.map((route) => (
        <Button
          key={route.href}
          asChild
          variant={route.active ? 'secondary' : 'ghost'}
          className={cn(
            'justify-start hover:bg-primary hover:text-primary-foreground',
            route.active && 'bg-primary text-primary-foreground font-medium hover:bg-primary/90'
          )}
        >
          <Link href={route.href}>
            <route.icon className="mr-2 h-4 w-4" />
            {route.label}
          </Link>
        </Button>
      ))}
    </nav>
  )
}
