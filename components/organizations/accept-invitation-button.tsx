'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { acceptInvitation } from '@/lib/actions/invitations'
import { useToast } from '@/lib/hooks/use-toast'

interface AcceptInvitationButtonProps {
  token: string
  organizationSlug: string | undefined
}

export function AcceptInvitationButton({ token, organizationSlug }: AcceptInvitationButtonProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  const handleAccept = () => {
    startTransition(async () => {
      const result = await acceptInvitation(token)

      if (result.error) {
        toast({
          title: 'Erro',
          description: result.error,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Convite aceito!',
          description: 'Bem-vindo à organização',
        })

        const slug = result.data?.slug || organizationSlug
        if (slug) {
          router.push(`/${slug}/dashboard`)
        }
      }
    })
  }

  return (
    <Button onClick={handleAccept} disabled={isPending} size="lg">
      {isPending ? 'Aceitando...' : 'Aceitar Convite'}
    </Button>
  )
}
