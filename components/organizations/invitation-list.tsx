'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Copy, X } from 'lucide-react'
import { revokeInvitation } from '@/lib/actions/invitations'
import { useToast } from '@/lib/hooks/use-toast'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Invitation } from '@/lib/types'

interface InvitationListProps {
  invitations: Invitation[]
}

export function InvitationList({ invitations }: InvitationListProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  const handleCopyLink = (token: string) => {
    const link = `${window.location.origin}/invitations/${token}`
    navigator.clipboard.writeText(link)
    toast({
      title: 'Link copiado!',
      description: 'Cole este link e envie para o convidado',
    })
  }

  const handleRevoke = (invitationId: string) => {
    startTransition(async () => {
      const result = await revokeInvitation(invitationId)

      if (result.error) {
        toast({
          title: 'Erro',
          description: result.error,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Convite revogado',
        })
      }
    })
  }

  if (invitations.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Convites Pendentes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {invitations.map((invitation: any) => (
            <div
              key={invitation.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{invitation.email}</p>
                  <Badge variant="outline">{invitation.role}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Convidado{' '}
                  {formatDistanceToNow(new Date(invitation.created_at), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyLink(invitation.token)}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar Link
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRevoke(invitation.id)}
                  disabled={isPending}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
