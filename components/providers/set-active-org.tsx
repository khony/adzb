'use client'

import { useEffect, useMemo } from 'react'
import { useActiveOrg } from '@/contexts/active-org-context'
import type { Organization } from '@/lib/types'

interface SetActiveOrgProps {
  organization: Organization
  children: React.ReactNode
}

export function SetActiveOrg({ organization, children }: SetActiveOrgProps) {
  const { setActiveOrg } = useActiveOrg()

  // Memoize organization based on id to detect actual changes
  const memoizedOrg = useMemo(
    () => organization,
    [organization.id]
  )

  useEffect(() => {
    setActiveOrg(memoizedOrg)
  }, [memoizedOrg, setActiveOrg])

  return <>{children}</>
}
