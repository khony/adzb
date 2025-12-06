'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CheckCircle2, AlertCircle, Eye } from 'lucide-react'
import { useActiveOrg } from '@/contexts/active-org-context'
import { useEvidences } from '@/lib/hooks/use-evidences'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export function EvidenceList() {
  const { activeOrg } = useActiveOrg()
  const params = useParams()
  const orgSlug = params.orgSlug as string
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

  const formatDate = (date: string) => {
    return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
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

      {/* Evidence Table */}
      {evidences.length === 0 ? (
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
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Status</TableHead>
                <TableHead>Palavra-chave</TableHead>
                <TableHead className="hidden md:table-cell">Tags</TableHead>
                <TableHead className="hidden sm:table-cell">Detectado em</TableHead>
                <TableHead className="w-[80px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {evidences.map((evidence) => (
                <TableRow key={evidence.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {evidence.is_positive ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      )}
                      <span
                        className={`hidden lg:inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          evidence.is_positive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {evidence.is_positive ? 'Positiva' : 'Negativa'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {evidence.keyword?.keyword || 'Desconhecido'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {evidence.keyword?.category ? (
                      <div className="flex flex-wrap gap-1">
                        {evidence.keyword.category.split(',').map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag.trim()}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {formatDate(evidence.detected_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/${orgSlug}/evidences/${evidence.id}`}>
                        <Eye className="w-4 h-4" />
                        <span className="sr-only">Ver detalhes</span>
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Info */}
      {!isLoading && evidences.length > 0 && (
        <div className="text-xs text-muted-foreground pt-2">
          Total: {evidences.length} evidência{evidences.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
