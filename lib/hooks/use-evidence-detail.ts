'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { EvidenceDetail, Keyword, EvidenceDomain, EvidenceScreenshot } from '@/lib/types'

export type EvidenceDetailWithKeyword = EvidenceDetail & {
  keyword: Keyword
}

export function useEvidenceDetail(evidenceId: string | undefined) {
  const [evidence, setEvidence] = useState<EvidenceDetailWithKeyword | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!evidenceId) {
      setIsLoading(false)
      return
    }

    async function fetchEvidenceDetail() {
      const supabase = createClient()

      // Fetch evidence with keyword
      const { data: evidenceData, error: evidenceError } = await supabase
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
        .eq('id', evidenceId)
        .single()

      if (evidenceError || !evidenceData) {
        setError(evidenceError?.message || 'Evidence not found')
        setIsLoading(false)
        return
      }

      // Fetch domains for this evidence
      const { data: domainsData } = await supabase
        .from('evidence_domains')
        .select('*')
        .eq('evidence_id', evidenceId)
        .order('created_at', { ascending: false })

      // Fetch screenshots for this evidence
      const { data: screenshotsData } = await supabase
        .from('evidence_screenshots')
        .select('*')
        .eq('evidence_id', evidenceId)
        .order('created_at', { ascending: false })

      const keywordData = Array.isArray(evidenceData.keywords)
        ? evidenceData.keywords[0]
        : evidenceData.keywords

      const completeEvidence: EvidenceDetailWithKeyword = {
        ...evidenceData,
        keyword: keywordData as Keyword,
        domains: (domainsData || []) as EvidenceDomain[],
        screenshots: (screenshotsData || []) as EvidenceScreenshot[],
      }

      setEvidence(completeEvidence)
      setIsLoading(false)
    }

    fetchEvidenceDetail()

    // Subscribe to real-time changes on evidence
    const supabase = createClient()
    const channel = supabase
      .channel(`evidence-detail:${evidenceId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'evidences',
          filter: `id=eq.${evidenceId}`,
        },
        (payload) => {
          if (evidence) {
            setEvidence({
              ...evidence,
              ...payload.new,
            })
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'evidence_domains',
          filter: `evidence_id=eq.${evidenceId}`,
        },
        (payload) => {
          if (evidence) {
            if (payload.eventType === 'INSERT') {
              setEvidence((prev) =>
                prev
                  ? {
                      ...prev,
                      domains: [payload.new as EvidenceDomain, ...prev.domains],
                    }
                  : null
              )
            } else if (payload.eventType === 'DELETE') {
              setEvidence((prev) =>
                prev
                  ? {
                      ...prev,
                      domains: prev.domains.filter((d) => d.id !== payload.old.id),
                    }
                  : null
              )
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'evidence_screenshots',
          filter: `evidence_id=eq.${evidenceId}`,
        },
        (payload) => {
          if (evidence) {
            if (payload.eventType === 'INSERT') {
              setEvidence((prev) =>
                prev
                  ? {
                      ...prev,
                      screenshots: [
                        payload.new as EvidenceScreenshot,
                        ...prev.screenshots,
                      ],
                    }
                  : null
              )
            } else if (payload.eventType === 'DELETE') {
              setEvidence((prev) =>
                prev
                  ? {
                      ...prev,
                      screenshots: prev.screenshots.filter(
                        (s) => s.id !== payload.old.id
                      ),
                    }
                  : null
              )
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [evidenceId])

  return { evidence, isLoading, error }
}
