'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Integration, IntegrationProvider } from '@/lib/types'

export function useIntegration(
  organizationId: string | undefined,
  provider: IntegrationProvider
) {
  const [integration, setIntegration] = useState<Integration | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!organizationId) {
      setIntegration(null)
      setIsLoading(false)
      return
    }

    const fetchIntegration = async () => {
      setIsLoading(true)
      setError(null)

      const supabase = createClient()

      const { data, error: fetchError } = await supabase
        .from('integrations')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('provider', provider)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        setError(fetchError.message)
      }

      setIntegration(data as Integration | null)
      setIsLoading(false)
    }

    fetchIntegration()
  }, [organizationId, provider])

  const refetch = async () => {
    if (!organizationId) return

    const supabase = createClient()

    const { data, error: fetchError } = await supabase
      .from('integrations')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('provider', provider)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      setError(fetchError.message)
    } else {
      setError(null)
    }

    setIntegration(data as Integration | null)
  }

  return {
    integration,
    isConnected: !!integration?.is_active,
    isLoading,
    error,
    refetch,
  }
}
