'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { EvidenceWithKeyword } from '@/lib/hooks/use-evidences'

interface EvidenceItemProps {
  evidence: EvidenceWithKeyword
}

export function EvidenceItem({ evidence }: EvidenceItemProps) {
  const params = useParams()
  const orgSlug = params.orgSlug as string

  const detectedDate = new Date(evidence.detected_at)
  const formattedDate = format(detectedDate, "dd 'de' MMMM 'às' HH:mm", {
    locale: ptBR,
  })

  return (
    <Button
      asChild
      variant="ghost"
      className="w-full justify-start h-auto py-3 px-4 rounded-lg border border-transparent hover:border-border hover:bg-muted"
    >
      <Link href={`/${orgSlug}/evidences/${evidence.id}`}>
        <div className="flex items-center gap-4 w-full">
          {/* Status Icon */}
          <div className="flex-shrink-0">
            {evidence.is_positive ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
          </div>

          {/* Keyword */}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">
              {evidence.keyword?.keyword || 'Desconhecido'}
            </p>
          </div>

          {/* Date */}
          <div className="flex-shrink-0 text-xs text-muted-foreground">
            {formattedDate}
          </div>

          {/* Status Badge */}
          <div className="flex-shrink-0">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                evidence.is_positive
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {evidence.is_positive ? 'Positiva' : 'Negativa'}
            </span>
          </div>
        </div>
      </Link>
    </Button>
  )
}
