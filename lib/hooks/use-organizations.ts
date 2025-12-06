'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Organization } from '@/lib/types'

export function useOrganizations() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchOrganizations() {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setIsLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('organization_members')
        .select(
          `
          role,
          organization:organizations(*)
        `
        )
        .eq('user_id', user.id)

      if (error) {
        setError(error.message)
      } else {
        const orgs = data
          ?.map((item: any) => ({
            ...item.organization,
            userRole: item.role,
          }))
          .filter(Boolean) as Organization[]
        setOrganizations(orgs || [])
      }

      setIsLoading(false)
    }

    fetchOrganizations()
  }, [])

  return { organizations, isLoading, error }
}
