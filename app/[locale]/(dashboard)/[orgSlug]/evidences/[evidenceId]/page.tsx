'use client'

import { useParams } from 'next/navigation'
import { useEvidenceDetail } from '@/lib/hooks/use-evidence-detail'
import { EvidenceDetail } from '@/components/evidences/evidence-detail'

export default function EvidenceDetailPage() {
  const params = useParams()
  const evidenceId = params.evidenceId as string

  const { evidence, isLoading, error } = useEvidenceDetail(evidenceId)

  return (
    <EvidenceDetail
      evidence={evidence}
      isLoading={isLoading}
      error={error}
    />
  )
}
