'use client'

import { NegotiationList } from '@/components/negotiations/negotiation-list'

export default function NegotiationsPage() {
  return (
    <div className="container py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Negociações</h1>
        <p className="text-muted-foreground">
          Gerencie as negociações da sua organização
        </p>
      </div>

      <NegotiationList />
    </div>
  )
}
