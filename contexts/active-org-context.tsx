'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import type { Organization } from '@/lib/types'

interface ActiveOrgContextType {
  activeOrg: Organization | null
  setActiveOrg: (org: Organization | null) => void
  isLoading: boolean
}

const ActiveOrgContext = createContext<ActiveOrgContextType | undefined>(undefined)

export function ActiveOrgProvider({
  children,
  initialOrg,
}: {
  children: ReactNode
  initialOrg?: Organization | null
}) {
  const [activeOrg, setActiveOrgState] = useState<Organization | null>(initialOrg || null)
  const [isLoading, setIsLoading] = useState(false)
  const pathname = usePathname()

  // Update active org when route changes
  useEffect(() => {
    setIsLoading(false)
  }, [pathname])

  // Memoize setActiveOrg to prevent re-renders
  const setActiveOrg = useCallback((org: Organization | null) => {
    setActiveOrgState(org)
    if (org) {
      // Persist to localStorage
      localStorage.setItem('activeOrgId', org.id)
    }
  }, [])

  // Memoize context value to prevent re-renders
  const value = useMemo(
    () => ({ activeOrg, setActiveOrg, isLoading }),
    [activeOrg, setActiveOrg, isLoading]
  )

  return (
    <ActiveOrgContext.Provider value={value}>
      {children}
    </ActiveOrgContext.Provider>
  )
}

export function useActiveOrg() {
  const context = useContext(ActiveOrgContext)
  if (context === undefined) {
    throw new Error('useActiveOrg must be used within ActiveOrgProvider')
  }
  return context
}
