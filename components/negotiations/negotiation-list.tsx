'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Plus, Eye, MoreVertical, Trash2 } from 'lucide-react'
import { useActiveOrg } from '@/contexts/active-org-context'
import { useNegotiations } from '@/lib/hooks/use-negotiations'
import { deleteNegotiation } from '@/lib/actions/negotiations'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { NegotiationListSkeleton } from './negotiation-skeleton'
import { NegotiationStatusBadge } from './negotiation-status-badge'
import { NegotiationForm } from './negotiation-form'
import { useToast } from '@/lib/hooks/use-toast'
import type { NegotiationStatus, NegotiationWithEvidence } from '@/lib/types'

export function NegotiationList() {
  const { activeOrg } = useActiveOrg()
  const params = useParams()
  const orgSlug = params.orgSlug as string
  const { toast } = useToast()
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [selectedNegotiation, setSelectedNegotiation] = useState<NegotiationWithEvidence | undefined>()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [negotiationToDelete, setNegotiationToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const statusFilter: NegotiationStatus | null =
    filterStatus === 'all' ? null : (filterStatus as NegotiationStatus)

  const { negotiations, isLoading, refetch } = useNegotiations(activeOrg?.id, {
    status: statusFilter,
  })

  // Reset filter state when organization changes
  useEffect(() => {
    setFilterStatus('all')
  }, [activeOrg?.id])

  const handleCloseForm = () => {
    setShowForm(false)
    setSelectedNegotiation(undefined)
  }

  const handleEdit = (negotiation: NegotiationWithEvidence) => {
    setSelectedNegotiation(negotiation)
    setShowForm(true)
  }

  const handleDeleteClick = (id: string) => {
    setNegotiationToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!negotiationToDelete) return

    setIsDeleting(true)
    const result = await deleteNegotiation(negotiationToDelete)
    setIsDeleting(false)

    if (result.error) {
      toast({
        title: 'Erro',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Sucesso',
        description: 'Negociação excluída',
      })
      refetch()
    }

    setDeleteDialogOpen(false)
    setNegotiationToDelete(null)
  }

  if (!activeOrg) {
    return null
  }

  if (isLoading) {
    return <NegotiationListSkeleton />
  }

  const formatDate = (date: string) => {
    return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
  }

  return (
    <div className="space-y-4">
      {/* Header with filter and create button */}
      <div className="flex items-center justify-between gap-2">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="in_progress">Em Andamento</SelectItem>
            <SelectItem value="resolved">Resolvidos</SelectItem>
            <SelectItem value="unresolved">Não Resolvidos</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Negociação
        </Button>
      </div>

      {/* Negotiations Table */}
      {negotiations.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <h3 className="text-lg font-semibold">Nenhuma negociação ainda</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Comece criando sua primeira negociação para gerenciar contatos com
              infratores.
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Negociação
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Assunto</TableHead>
                <TableHead className="hidden sm:table-cell">Evidência</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Última Interação</TableHead>
                <TableHead className="w-[80px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {negotiations.map((negotiation) => (
                <TableRow key={negotiation.id}>
                  <TableCell className="font-medium max-w-[200px] truncate">
                    {negotiation.subject}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {negotiation.evidence?.keyword?.keyword ? (
                      <div className="flex flex-col">
                        <span className="text-sm">
                          {negotiation.evidence.keyword.keyword}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(
                            new Date(negotiation.evidence.detected_at),
                            'dd/MM/yyyy',
                            { locale: ptBR }
                          )}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <NegotiationStatusBadge status={negotiation.status} />
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {formatDate(negotiation.last_interaction_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Ações</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/${orgSlug}/negotiations/${negotiation.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver detalhes
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDeleteClick(negotiation.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Info */}
      {!isLoading && negotiations.length > 0 && (
        <div className="text-xs text-muted-foreground pt-2">
          Total: {negotiations.length} negociação{negotiations.length !== 1 ? 'ões' : ''}
        </div>
      )}

      {/* Form Dialog */}
      <NegotiationForm
        organizationId={activeOrg.id}
        negotiation={selectedNegotiation}
        open={showForm}
        onOpenChange={handleCloseForm}
        onSuccess={refetch}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir negociação?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A negociação e todos os seus anexos
              serão permanentemente excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
