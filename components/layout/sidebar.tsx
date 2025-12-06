'use client'

import { OrgSwitcher } from './org-switcher'
import { SidebarNav } from './sidebar-nav'
import { UserMenu } from './user-menu'
import { Separator } from '@/components/ui/separator'
import type { Profile } from '@/lib/types'

interface SidebarProps {
  user: Profile
}

export function Sidebar({ user }: SidebarProps) {
  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      {/* Organization Switcher */}
      <div className="p-4">
        <OrgSwitcher />
      </div>

      <Separator />

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4">
        <SidebarNav />
      </div>

      <Separator />

      {/* User Menu */}
      <div className="p-2">
        <UserMenu user={user} />
      </div>
    </div>
  )
}
