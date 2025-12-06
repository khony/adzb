'use client'

import { useState, useEffect } from 'react'
import { useKeywords } from '@/lib/hooks/use-keywords'
import { useActiveOrg } from '@/contexts/active-org-context'
import { KeywordItem } from './keyword-item'
import { KeywordForm } from './keyword-form'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import type { Keyword } from '@/lib/types'

export function KeywordList() {
  const { activeOrg } = useActiveOrg()
  const { keywords, isLoading, refetch } = useKeywords(activeOrg?.id)
  const [selectedKeyword, setSelectedKeyword] = useState<Keyword | undefined>()
  const [showForm, setShowForm] = useState(false)

  // Reset form state when organization changes
  useEffect(() => {
    setSelectedKeyword(undefined)
    setShowForm(false)
  }, [activeOrg?.id])

  const handleEdit = (keyword: Keyword) => {
    setSelectedKeyword(keyword)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setSelectedKeyword(undefined)
  }

  if (keywords.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
          <h3 className="text-lg font-semibold">Nenhuma keyword ainda</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Comece adicionando sua primeira keyword para começar a organizar seu conteúdo.
          </p>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Keyword
          </Button>
        </div>

        {activeOrg && (
          <KeywordForm
            organizationId={activeOrg.id}
            open={showForm}
            onOpenChange={handleCloseForm}
            onSuccess={refetch}
          />
        )}
      </div>
    )
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Keyword
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {keywords.map((keyword) => (
          <KeywordItem
            key={keyword.id}
            keyword={keyword}
            onEdit={handleEdit}
            canDelete={activeOrg?.userRole === 'admin'}
            onDeleteSuccess={refetch}
          />
        ))}
      </div>

      {activeOrg && (
        <KeywordForm
          organizationId={activeOrg.id}
          keyword={selectedKeyword}
          open={showForm}
          onOpenChange={handleCloseForm}
          onSuccess={refetch}
        />
      )}
    </>
  )
}
