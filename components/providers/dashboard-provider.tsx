'use client'

import { ReactNode } from 'react'
import { ActiveOrgProvider } from '@/contexts/active-org-context'

interface DashboardProviderProps {
  children: ReactNode
}

export function DashboardProvider({ children }: DashboardProviderProps) {
  return (
    <ActiveOrgProvider initialOrg={null}>
      {children}
    </ActiveOrgProvider>
  )
}
