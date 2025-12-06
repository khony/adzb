'use client'

import { useState, useEffect } from 'react'
import { useActiveOrg } from '@/contexts/active-org-context'
import { useEvidences } from '@/lib/hooks/use-evidences'
import { EvidenceItem } from './evidence-item'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

export function EvidenceList() {
  const { activeOrg } = useActiveOrg()
  const [filterType, setFilterType] = useState<string>('all')

  const isPositiveFilter =
    filterType === 'positive' ? true : filterType === 'negative' ? false : null

  const { evidences, isLoading } = useEvidences(activeOrg?.id, {
    isPositive: isPositiveFilter,
  })

  // Reset filter state when organization changes
  useEffect(() => {
    setFilterType('all')
  }, [activeOrg?.id])

  if (!activeOrg) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-2">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as evidências</SelectItem>
            <SelectItem value="positive">Positivas</SelectItem>
            <SelectItem value="negative">Negativas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Evidence List */}
      <div className="space-y-2">
        {evidences.length === 0 ? (
          // Empty state
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhuma evidência encontrada
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Evidências serão criadas automaticamente pelo sistema de
              monitoramento
            </p>
          </div>
        ) : (
          // Evidence items
          evidences.map((evidence) => (
            <EvidenceItem key={evidence.id} evidence={evidence} />
          ))
        )}
      </div>

      {/* Info */}
      {!isLoading && evidences.length > 0 && (
        <div className="text-xs text-muted-foreground pt-2">
          Total: {evidences.length} evidência{evidences.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
