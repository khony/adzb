'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { subDays, format, startOfDay, endOfDay } from 'date-fns'

export interface DashboardStats {
  keywordsCount: number
  evidencesCount: number
  positiveEvidencesCount: number
  negativeEvidencesCount: number
  negotiationsCount: number
  categoriesCount: number
  activeUsersCount: number
  negativeEvidencesByDay: { date: string; count: number }[]
}

export function useDashboardStats(organizationId: string | undefined) {
  const [stats, setStats] = useState<DashboardStats>({
    keywordsCount: 0,
    evidencesCount: 0,
    positiveEvidencesCount: 0,
    negativeEvidencesCount: 0,
    negotiationsCount: 0,
    categoriesCount: 0,
    activeUsersCount: 0,
    negativeEvidencesByDay: [],
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!organizationId) {
      setStats({
        keywordsCount: 0,
        evidencesCount: 0,
        positiveEvidencesCount: 0,
        negativeEvidencesCount: 0,
        negotiationsCount: 0,
        categoriesCount: 0,
        activeUsersCount: 0,
        negativeEvidencesByDay: [],
      })
      setIsLoading(false)
      return
    }

    const fetchStats = async () => {
      setIsLoading(true)
      setError(null)

      const supabase = createClient()

      try {
        // Fetch all stats in parallel
        const [
          keywordsResult,
          evidencesResult,
          positiveResult,
          negativeResult,
          membersResult,
          categoriesResult,
          negativeByDayResult,
        ] = await Promise.all([
          // Keywords count
          supabase
            .from('keywords')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', organizationId),

          // Total evidences count
          supabase
            .from('evidences')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', organizationId),

          // Positive evidences count
          supabase
            .from('evidences')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', organizationId)
            .eq('is_positive', true),

          // Negative evidences count
          supabase
            .from('evidences')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', organizationId)
            .eq('is_positive', false),

          // Active members count
          supabase
            .from('organization_members')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', organizationId),

          // Unique categories count
          supabase
            .from('keywords')
            .select('category')
            .eq('organization_id', organizationId)
            .not('category', 'is', null),

          // Negative evidences from the last 7 days
          supabase
            .from('evidences')
            .select('detected_at')
            .eq('organization_id', organizationId)
            .eq('is_positive', false)
            .gte('detected_at', subDays(new Date(), 6).toISOString())
            .order('detected_at', { ascending: true }),
        ])

        // Calculate unique categories
        const uniqueCategories = new Set<string>()
        if (categoriesResult.data) {
          categoriesResult.data.forEach((item) => {
            if (item.category) {
              item.category.split(',').forEach((cat: string) => {
                uniqueCategories.add(cat.trim().toLowerCase())
              })
            }
          })
        }

        // Process negative evidences by day for the last 7 days
        const last7Days: { date: string; count: number }[] = []
        for (let i = 6; i >= 0; i--) {
          const date = subDays(new Date(), i)
          const dateStr = format(date, 'yyyy-MM-dd')
          last7Days.push({ date: dateStr, count: 0 })
        }

        if (negativeByDayResult.data) {
          negativeByDayResult.data.forEach((evidence) => {
            const dateStr = format(new Date(evidence.detected_at), 'yyyy-MM-dd')
            const dayEntry = last7Days.find((d) => d.date === dateStr)
            if (dayEntry) {
              dayEntry.count++
            }
          })
        }

        setStats({
          keywordsCount: keywordsResult.count || 0,
          evidencesCount: evidencesResult.count || 0,
          positiveEvidencesCount: positiveResult.count || 0,
          negativeEvidencesCount: negativeResult.count || 0,
          negotiationsCount: 0, // TODO: Add when negotiations table exists
          categoriesCount: uniqueCategories.size,
          activeUsersCount: membersResult.count || 0,
          negativeEvidencesByDay: last7Days,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar estatísticas')
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [organizationId])

  return { stats, isLoading, error }
}
