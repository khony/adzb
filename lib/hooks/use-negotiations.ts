'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Negotiation, NegotiationStatus, NegotiationWithEvidence } from '@/lib/types'

interface UseNegotiationsOptions {
  status?: NegotiationStatus | null
}

export function useNegotiations(
  organizationId: string | undefined,
  options: UseNegotiationsOptions = {}
) {
  const [negotiations, setNegotiations] = useState<NegotiationWithEvidence[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!organizationId) {
      setNegotiations([])
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
      .channel(`negotiations:${organizationId}`, {
        config: {
          presence: { key: organizationId },
        },
      })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'negotiations',
          filter: `organization_id=eq.${organizationId}`,
        },
        (payload) => {
          if (!isMounted || currentOrgId !== organizationId) return

          if (payload.eventType === 'INSERT') {
            const newNegotiation = payload.new as Negotiation
            supabase
              .from('negotiations')
              .select(
                `
                *,
                evidences(
                  id,
                  detected_at,
                  keywords(keyword)
                )
              `
              )
              .eq('id', newNegotiation.id)
              .single()
              .then(({ data }) => {
                if (data) {
                  const mappedItem = {
                    ...data,
                    evidence: Array.isArray(data.evidences) ? data.evidences[0] : data.evidences,
                  } as NegotiationWithEvidence
                  setNegotiations((prev) => [mappedItem, ...prev])
                }
              })
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old?.id
            setNegotiations((prev) => prev.filter((n) => n.id !== deletedId))
          } else if (payload.eventType === 'UPDATE') {
            const updatedNegotiation = payload.new as Negotiation
            supabase
              .from('negotiations')
              .select(
                `
                *,
                evidences(
                  id,
                  detected_at,
                  keywords(keyword)
                )
              `
              )
              .eq('id', updatedNegotiation.id)
              .single()
              .then(({ data }) => {
                if (data) {
                  const mappedItem = {
                    ...data,
                    evidence: Array.isArray(data.evidences) ? data.evidences[0] : data.evidences,
                  } as NegotiationWithEvidence
                  setNegotiations((prev) =>
                    prev.map((n) => (n.id === mappedItem.id ? mappedItem : n))
                  )
                }
              })
          }
        }
      )
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && isMounted && currentOrgId === organizationId) {
          let query = supabase
            .from('negotiations')
            .select(
              `
              *,
              evidences(
                id,
                detected_at,
                keywords(keyword)
              )
            `
            )
            .eq('organization_id', organizationId)

          if (options.status) {
            query = query.eq('status', options.status)
          }

          const { data, error } = await query.order('last_interaction_at', {
            ascending: false,
          })

          if (!isMounted || currentOrgId !== organizationId) return

          if (error) {
            setError(error.message)
            setNegotiations([])
          } else {
            const mappedData = data?.map((item: any) => ({
              ...item,
              evidence: Array.isArray(item.evidences) ? item.evidences[0] : item.evidences,
            })) as NegotiationWithEvidence[]
            setNegotiations(mappedData || [])
          }

          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [organizationId, options.status])

  const refetch = async () => {
    if (!organizationId) return

    const supabase = createClient()

    let query = supabase
      .from('negotiations')
      .select(
        `
        *,
        evidences(
          id,
          detected_at,
          keywords(keyword)
        )
      `
      )
      .eq('organization_id', organizationId)

    if (options.status) {
      query = query.eq('status', options.status)
    }

    const { data, error } = await query.order('last_interaction_at', {
      ascending: false,
    })

    if (!error && data) {
      const mappedData = data.map((item: any) => ({
        ...item,
        evidence: Array.isArray(item.evidences) ? item.evidences[0] : item.evidences,
      })) as NegotiationWithEvidence[]
      setNegotiations(mappedData)
    }
  }

  return { negotiations, isLoading, error, refetch }
}
