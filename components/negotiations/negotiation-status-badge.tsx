'use client'

import { Badge } from '@/components/ui/badge'
import { useTranslations } from 'next-intl'
import type { NegotiationStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

const statusColors: Record<NegotiationStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80 dark:bg-yellow-900/30 dark:text-yellow-400',
  in_progress: 'bg-orange-100 text-orange-800 hover:bg-orange-100/80 dark:bg-orange-900/30 dark:text-orange-400',
  resolved: 'bg-green-100 text-green-800 hover:bg-green-100/80 dark:bg-green-900/30 dark:text-green-400',
  unresolved: 'bg-red-100 text-red-800 hover:bg-red-100/80 dark:bg-red-900/30 dark:text-red-400',
}

interface NegotiationStatusBadgeProps {
  status: NegotiationStatus
}

export function NegotiationStatusBadge({ status }: NegotiationStatusBadgeProps) {
  const t = useTranslations('negotiations.status')

  return (
    <Badge className={cn('border-0', statusColors[status])}>
      {t(status)}
    </Badge>
  )
}
