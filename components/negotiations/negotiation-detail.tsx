'use client'

import { useEffect, useState, useTransition } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowLeft, Calendar, Mail, FileText, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { updateNegotiationStatus } from '@/lib/actions/negotiations'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { NegotiationStatusBadge } from './negotiation-status-badge'
import { RecipientBadges } from './recipient-badges'
import { useToast } from '@/lib/hooks/use-toast'
import type { NegotiationDetail as NegotiationDetailType, NegotiationStatus } from '@/lib/types'

interface NegotiationDetailProps {
  negotiationId: string
}

export function NegotiationDetail({ negotiationId }: NegotiationDetailProps) {
  const params = useParams()
  const orgSlug = params.orgSlug as string
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [negotiation, setNegotiation] = useState<NegotiationDetailType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchNegotiation() {
      setIsLoading(true)
      setError(null)

      const supabase = createClient()

      const { data, error } = await supabase
        .from('negotiations')
        .select(
          `
          *,
          evidences(
            id,
            detected_at,
            is_positive,
            keywords(id, keyword, category)
          ),
          negotiation_attachments(*)
        `
        )
        .eq('id', negotiationId)
        .single()

      if (error) {
        setError(error.message)
        setNegotiation(null)
      } else if (data) {
        const rawEvidence = Array.isArray(data.evidences) ? data.evidences[0] : data.evidences
        const evidence = rawEvidence
          ? {
              ...rawEvidence,
              keyword: Array.isArray(rawEvidence.keywords)
                ? rawEvidence.keywords[0]
                : rawEvidence.keywords,
            }
          : null

        setNegotiation({
          ...data,
          evidence,
          attachments: data.negotiation_attachments || [],
        } as NegotiationDetailType)
      }

      setIsLoading(false)
    }

    fetchNegotiation()
  }, [negotiationId])

  const handleStatusChange = (newStatus: NegotiationStatus) => {
    startTransition(async () => {
      const result = await updateNegotiationStatus(negotiationId, newStatus)

      if (result.error) {
        toast({
          title: 'Erro',
          description: result.error,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Sucesso',
          description: 'Status atualizado',
        })
        setNegotiation((prev) =>
          prev
            ? { ...prev, status: newStatus, last_interaction_at: new Date().toISOString() }
            : null
        )
      }
    })
  }

  if (error) {
    return (
      <div className="container py-6">
        <Button asChild variant="ghost" className="mb-6">
          <Link href={`/${orgSlug}/negotiations`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Link>
        </Button>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          <p className="font-medium">Erro ao carregar negociação</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container py-6">
        <Button disabled variant="ghost" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div className="space-y-6">
          <Skeleton className="h-12 w-full max-w-md" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-60 w-full" />
        </div>
      </div>
    )
  }

  if (!negotiation) {
    return (
      <div className="container py-6">
        <Button asChild variant="ghost" className="mb-6">
          <Link href={`/${orgSlug}/negotiations`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Link>
        </Button>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Negociação não encontrada</p>
        </div>
      </div>
    )
  }

  const createdDate = format(new Date(negotiation.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
    locale: ptBR,
  })

  const lastInteractionDate = format(
    new Date(negotiation.last_interaction_at),
    "dd 'de' MMMM 'de' yyyy 'às' HH:mm",
    { locale: ptBR }
  )

  return (
    <div className="container py-6">
      <Button asChild variant="ghost" className="mb-6">
        <Link href={`/${orgSlug}/negotiations`}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Link>
      </Button>

      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold">{negotiation.subject}</h1>
              <p className="text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Criado em {createdDate}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Select
                value={negotiation.status}
                onValueChange={handleStatusChange}
                disabled={isPending}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                  <SelectItem value="resolved">Resolvido</SelectItem>
                  <SelectItem value="unresolved">Não Resolvido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NegotiationStatusBadge status={negotiation.status} />
            <span className="text-xs text-muted-foreground">
              Última interação: {lastInteractionDate}
            </span>
          </div>
        </div>

        {/* Evidence Card (if linked) */}
        {negotiation.evidence && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Evidência Vinculada</CardTitle>
              <CardDescription>
                Esta negociação está relacionada a uma evidência detectada
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">
                    {negotiation.evidence.keyword?.keyword || 'Desconhecido'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Detectado em{' '}
                    {format(new Date(negotiation.evidence.detected_at), 'dd/MM/yyyy', {
                      locale: ptBR,
                    })}
                  </p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link
                    href={`/${orgSlug}/evidences/${negotiation.evidence.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Ver Evidência
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recipients & Content Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Detalhes da Negociação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Destinatários</span>
              </div>
              <RecipientBadges recipients={negotiation.recipients} maxDisplay={10} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Conteúdo</span>
              </div>
              <div className="prose prose-sm max-w-none whitespace-pre-wrap bg-muted/30 p-4 rounded-lg">
                {negotiation.content}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attachments Card */}
        {negotiation.attachments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Anexos</CardTitle>
              <CardDescription>
                {negotiation.attachments.length} arquivo{negotiation.attachments.length !== 1 ? 's' : ''} anexado{negotiation.attachments.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {negotiation.attachments.map((attachment) => (
                  <li
                    key={attachment.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="truncate">{attachment.file_name}</span>
                      {attachment.file_size && (
                        <span className="text-xs text-muted-foreground shrink-0">
                          ({(attachment.file_size / 1024).toFixed(1)} KB)
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
