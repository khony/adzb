'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import { UserMinus } from 'lucide-react'
import { removeMember } from '@/lib/actions/invitations'
import { useToast } from '@/lib/hooks/use-toast'
import type { OrganizationMember } from '@/lib/types'

interface MemberListProps {
  members: OrganizationMember[]
  organizationId: string
  currentUserId: string
  isAdmin: boolean
}

export function MemberList({ members, organizationId, currentUserId, isAdmin }: MemberListProps) {
  const { toast } = useToast()
  const [selectedMember, setSelectedMember] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleRemove = () => {
    if (!selectedMember) return

    startTransition(async () => {
      const result = await removeMember(organizationId, selectedMember)

      if (result.error) {
        toast({
          title: 'Erro',
          description: result.error,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Membro removido',
        })
      }

      setSelectedMember(null)
    })
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Membros ({members.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {members.map((member: any) => {
              const profile = member.profile
              const initials =
                profile.full_name
                  ?.split(' ')
                  .map((n: string) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2) || profile.email.charAt(0).toUpperCase()

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={profile.avatar_url || undefined} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {profile.full_name || profile.email}
                        </p>
                        <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                          {member.role}
                        </Badge>
                        {member.user_id === currentUserId && (
                          <Badge variant="outline">Você</Badge>
                        )}
                      </div>
                      {profile.full_name && (
                        <p className="text-xs text-muted-foreground">{profile.email}</p>
                      )}
                    </div>
                  </div>

                  {isAdmin && member.user_id !== currentUserId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedMember(member.user_id)}
                    >
                      <UserMinus className="mr-2 h-4 w-4" />
                      Remover
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover membro?</AlertDialogTitle>
            <AlertDialogDescription>
              Este membro perderá acesso à organização e todos os seus dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} disabled={isPending}>
              {isPending ? 'Removendo...' : 'Remover'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
