'use client'

import { useParams } from 'next/navigation'
import { NegotiationDetail } from '@/components/negotiations/negotiation-detail'

export default function NegotiationDetailPage() {
  const params = useParams()
  const negotiationId = params.negotiationId as string

  return <NegotiationDetail negotiationId={negotiationId} />
}
