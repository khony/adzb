'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Evidence, Keyword } from '@/lib/types'

export type EvidenceWithKeyword = Evidence & {
  keyword: Keyword
}

interface UseEvidencesOptions {
  keywordId?: string
  isPositive?: boolean | null
}

export function useEvidences(
  organizationId: string | undefined,
  options: UseEvidencesOptions = {}
) {
  const [evidences, setEvidences] = useState<EvidenceWithKeyword[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!organizationId) {
      setEvidences([])
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
      .channel(`evidences:${organizationId}`, {
        config: {
          presence: { key: organizationId },
        },
      })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'evidences',
          filter: `organization_id=eq.${organizationId}`,
        },
        (payload) => {
          // Ignore events from old organization subscriptions
          if (!isMounted || currentOrgId !== organizationId) return

          if (payload.eventType === 'INSERT') {
            // Fetch the new evidence with keyword details
            const newEvidence = payload.new as Evidence
            supabase
              .from('evidences')
              .select(
                `
                id,
                organization_id,
                keyword_id,
                is_positive,
                created_at,
                detected_at,
                keywords(id, organization_id, keyword, description, category, created_by, created_at, updated_at)
              `
              )
              .eq('id', newEvidence.id)
              .single()
              .then(({ data }) => {
                if (data) {
                  const mappedItem = {
                    ...data,
                    keyword: Array.isArray(data.keywords) ? data.keywords[0] : data.keywords,
                  } as EvidenceWithKeyword
                  setEvidences((prev) => [mappedItem, ...prev])
                }
              })
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old?.id
            setEvidences((prev) => prev.filter((e) => e.id !== deletedId))
          } else if (payload.eventType === 'UPDATE') {
            setEvidences((prev) =>
              prev.map((e) =>
                e.id === payload.new.id
                  ? { ...e, ...(payload.new as Evidence) }
                  : e
              )
            )
          }
        }
      )
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && isMounted && currentOrgId === organizationId) {
          // Fetch initial data when subscription is ready
          let query = supabase
            .from('evidences')
            .select(
              `
              id,
              organization_id,
              keyword_id,
              is_positive,
              created_at,
              detected_at,
              keywords(id, organization_id, keyword, description, category, created_by, created_at, updated_at)
            `
            )
            .eq('organization_id', organizationId)

          if (options.keywordId) {
            query = query.eq('keyword_id', options.keywordId)
          }

          if (options.isPositive !== null && options.isPositive !== undefined) {
            query = query.eq('is_positive', options.isPositive)
          }

          const { data, error } = await query.order('detected_at', {
            ascending: false,
          })

          if (!isMounted || currentOrgId !== organizationId) return

          if (error) {
            setError(error.message)
            setEvidences([])
          } else {
            const mappedData = data?.map((item: any) => ({
              ...item,
              keyword: Array.isArray(item.keywords) ? item.keywords[0] : item.keywords,
            })) as EvidenceWithKeyword[]
            setEvidences(mappedData || [])
          }

          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [organizationId, options.keywordId, options.isPositive])

  const refetch = async () => {
    if (!organizationId) return

    const supabase = createClient()

    let query = supabase
      .from('evidences')
      .select(
        `
        id,
        organization_id,
        keyword_id,
        is_positive,
        created_at,
        detected_at,
        keywords(id, organization_id, keyword, description, category, created_by, created_at, updated_at)
      `
      )
      .eq('organization_id', organizationId)

    if (options.keywordId) {
      query = query.eq('keyword_id', options.keywordId)
    }

    if (options.isPositive !== null && options.isPositive !== undefined) {
      query = query.eq('is_positive', options.isPositive)
    }

    const { data, error } = await query.order('detected_at', {
      ascending: false,
    })

    if (!error && data) {
      const mappedData = data.map((item: any) => ({
        ...item,
        keyword: Array.isArray(item.keywords) ? item.keywords[0] : item.keywords,
      })) as EvidenceWithKeyword[]
      setEvidences(mappedData)
    }
  }

  return { evidences, isLoading, error, refetch }
}
