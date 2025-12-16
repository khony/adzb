'use client'

import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useActiveOrg } from '@/contexts/active-org-context'
import { LayoutDashboard, Key, Settings, Plug, Eye, Handshake } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { useTranslations } from 'next-intl'

export function SidebarNav() {
  const pathname = usePathname()
  const { activeOrg } = useActiveOrg()
  const t = useTranslations('navigation')

  if (!activeOrg) {
    return null
  }

  const routes = [
    {
      label: t('dashboard'),
      icon: LayoutDashboard,
      href: `/${activeOrg.slug}/dashboard`,
      active: pathname.includes(`/${activeOrg.slug}/dashboard`),
    },
    {
      label: t('keywords'),
      icon: Key,
      href: `/${activeOrg.slug}/keywords`,
      active: pathname.includes(`/${activeOrg.slug}/keywords`),
    },
    {
      label: t('evidences'),
      icon: Eye,
      href: `/${activeOrg.slug}/evidences`,
      active: pathname.includes(`/${activeOrg.slug}/evidences`),
    },
    {
      label: t('negotiations'),
      icon: Handshake,
      href: `/${activeOrg.slug}/negotiations`,
      active: pathname.includes(`/${activeOrg.slug}/negotiations`),
    },
    {
      label: t('integrations'),
      icon: Plug,
      href: `/${activeOrg.slug}/integrations`,
      active: pathname.includes(`/${activeOrg.slug}/integrations`),
    },
    {
      label: t('settings'),
      icon: Settings,
      href: `/${activeOrg.slug}/settings/general`,
      active: pathname.includes(`/${activeOrg.slug}/settings`),
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
