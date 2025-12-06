'use client'

import { useState } from 'react'
import { MemberList } from './member-list'
import { InvitationList } from './invitation-list'
import { InviteMemberDialog } from './invite-member-dialog'
import { Button } from '@/components/ui/button'
import { UserPlus } from 'lucide-react'
import type { OrganizationMember, Invitation } from '@/lib/types'

interface MembersPageClientProps {
  organizationId: string
  isAdmin: boolean
  members: OrganizationMember[]
  invitations: Invitation[]
  currentUserId: string
}

export function MembersPageClient({
  organizationId,
  isAdmin,
  members,
  invitations,
  currentUserId,
}: MembersPageClientProps) {
  const [showInviteDialog, setShowInviteDialog] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Membros da Equipe</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie os membros e convites da sua organização
          </p>
        </div>

        {isAdmin && (
          <Button onClick={() => setShowInviteDialog(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Convidar Membro
          </Button>
        )}
      </div>

      {isAdmin && <InvitationList invitations={invitations} />}

      <MemberList
        members={members}
        organizationId={organizationId}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
      />

      {isAdmin && (
        <InviteMemberDialog
          organizationId={organizationId}
          open={showInviteDialog}
          onOpenChange={setShowInviteDialog}
        />
      )}
    </div>
  )
}
