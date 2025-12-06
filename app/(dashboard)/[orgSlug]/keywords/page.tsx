'use client'

import { KeywordList } from '@/components/keywords/keyword-list'

export default function KeywordsPage() {
  return (
    <div className="container py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Palavras-chave</h1>
        <p className="text-muted-foreground">
          Gerencie as palavras-chave da sua organização
        </p>
      </div>

      <KeywordList />
    </div>
  )
}
