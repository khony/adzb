'use client'

import { EvidenceList } from '@/components/evidences/evidence-list'

export default function EvidencesPage() {
  return (
    <div className="container py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Evidências</h1>
        <p className="text-muted-foreground">
          Visualize as evidências de monitoramento das suas palavras-chave
        </p>
      </div>

      <EvidenceList />
    </div>
  )
}
