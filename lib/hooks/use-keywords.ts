'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Keyword } from '@/lib/types'

export function useKeywords(organizationId: string | undefined) {
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!organizationId) {
      setKeywords([])
      setIsLoading(false)
      setError(null)
      return
    }

    let isMounted = true
    const currentOrgId = organizationId

    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const channel = supabase
      .channel(`keywords:${organizationId}`, {
        config: {
          presence: { key: organizationId },
        },
      })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'keywords',
          filter: `organization_id=eq.${organizationId}`,
        },
        (payload) => {
          // Ignore events from old organization subscriptions
          if (!isMounted || currentOrgId !== organizationId) return

          if (payload.eventType === 'INSERT') {
            setKeywords((prev) => [payload.new as Keyword, ...prev])
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old?.id
            setKeywords((prev) => prev.filter((k) => k.id !== deletedId))
          } else if (payload.eventType === 'UPDATE') {
            setKeywords((prev) =>
              prev.map((k) => (k.id === payload.new.id ? (payload.new as Keyword) : k))
            )
          }
        }
      )
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && isMounted && currentOrgId === organizationId) {
          // Fetch initial data when subscription is ready
          const { data, error } = await supabase
            .from('keywords')
            .select('*')
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false })

          if (!isMounted || currentOrgId !== organizationId) return

          if (error) {
            setError(error.message)
            setKeywords([])
          } else {
            setKeywords(data as Keyword[])
          }

          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [organizationId])

  const refetch = async () => {
    if (!organizationId) return

    const supabase = createClient()
    const { data, error } = await supabase
      .from('keywords')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setKeywords(data as Keyword[])
    }
  }

  return { keywords, isLoading, error, refetch }
}
