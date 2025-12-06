'use client'

import { useOrganizations } from '@/lib/hooks/use-organizations'
import { useActiveOrg } from '@/contexts/active-org-context'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

export function OrgSwitcher() {
  const { organizations, isLoading } = useOrganizations()
  const { activeOrg, setActiveOrg } = useActiveOrg()
  const router = useRouter()

  if (isLoading) {
    return <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
  }

  const handleSelectOrg = (org: typeof organizations[0]) => {
    setActiveOrg(org)
    router.push(`/${org.slug}/keywords`)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-full justify-between"
        >
          <div className="flex items-center gap-2 truncate">
            <Avatar className="h-5 w-5">
              <AvatarImage src={activeOrg?.avatar_url || undefined} />
              <AvatarFallback className="text-xs">
                {activeOrg?.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="truncate">{activeOrg?.name || 'Selecione'}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuLabel>Organizações</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {organizations.length === 0 ? (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            Nenhuma organização encontrada
          </div>
        ) : (
          organizations.map((org) => (
            <DropdownMenuItem
              key={org.id}
              onSelect={() => handleSelectOrg(org)}
              className="cursor-pointer"
            >
              <div className="flex items-center gap-2 truncate">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={org.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {org.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{org.name}</span>
              </div>
              {activeOrg?.id === org.id && (
                <Check className="ml-auto h-4 w-4" />
              )}
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => router.push('/onboarding')}
          className="cursor-pointer"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova Organização
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
