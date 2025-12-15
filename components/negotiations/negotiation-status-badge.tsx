import { Badge } from '@/components/ui/badge'
import type { NegotiationStatus } from '@/lib/types'

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline'

const statusConfig: Record<NegotiationStatus, { label: string; variant: BadgeVariant }> = {
  pending: {
    label: 'Pendente',
    variant: 'outline',
  },
  in_progress: {
    label: 'Em Andamento',
    variant: 'default',
  },
  resolved: {
    label: 'Resolvido',
    variant: 'secondary',
  },
  unresolved: {
    label: 'Não Resolvido',
    variant: 'destructive',
  },
}

interface NegotiationStatusBadgeProps {
  status: NegotiationStatus
}

export function NegotiationStatusBadge({ status }: NegotiationStatusBadgeProps) {
  const config = statusConfig[status]
  return <Badge variant={config.variant}>{config.label}</Badge>
}
