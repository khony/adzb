'use client'

import { useState, useTransition, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { updateOrgSchema, type UpdateOrgInput } from '@/lib/validations/organization'
import { updateOrganizationSettings } from '@/lib/actions/profile'
import { uploadOrgLogo } from '@/lib/utils/storage'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/lib/hooks/use-toast'
import { Upload } from 'lucide-react'
import type { Organization } from '@/lib/types'

interface OrgSettingsFormProps {
  organization: Organization
}

export function OrgSettingsForm({ organization }: OrgSettingsFormProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [logoUrl, setLogoUrl] = useState(organization.avatar_url)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<UpdateOrgInput>({
    resolver: zodResolver(updateOrgSchema),
    defaultValues: {
      name: organization.name,
      description: organization.description || '',
    },
  })

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'Erro',
        description: 'A imagem deve ter no máximo 2MB',
        variant: 'destructive',
      })
      return
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Erro',
        description: 'Apenas imagens são permitidas',
        variant: 'destructive',
      })
      return
    }

    setIsUploadingLogo(true)

    const url = await uploadOrgLogo(file, organization.id)

    if (url) {
      setLogoUrl(url)

      // Save to database immediately
      const formData = new FormData()
      formData.append('avatarUrl', url)

      const result = await updateOrganizationSettings(organization.id, formData)

      if (result.error) {
        toast({
          title: 'Erro ao salvar',
          description: result.error,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Logo atualizado',
          description: 'O logo da organização foi atualizado',
        })
      }
    } else {
      toast({
        title: 'Erro',
        description: 'Erro ao fazer upload do logo',
        variant: 'destructive',
      })
    }

    setIsUploadingLogo(false)
  }

  async function onSubmit(values: UpdateOrgInput) {
    const formData = new FormData()
    if (values.name) formData.append('name', values.name)
    if (values.description !== undefined) formData.append('description', values.description)
    if (logoUrl) formData.append('avatarUrl', logoUrl)

    startTransition(async () => {
      const result = await updateOrganizationSettings(organization.id, formData)

      if (result.error) {
        toast({
          title: 'Erro',
          description: result.error,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Organização atualizada',
          description: 'As configurações foram salvas',
        })
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center gap-6">
          <Avatar className="h-24 w-24">
            <AvatarImage src={logoUrl || undefined} />
            <AvatarFallback className="text-2xl">
              {organization.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoChange}
              disabled={isUploadingLogo}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingLogo}
            >
              <Upload className="mr-2 h-4 w-4" />
              {isUploadingLogo ? 'Fazendo upload...' : 'Alterar logo'}
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">
              JPG, PNG ou WebP. Máximo 2MB.
            </p>
          </div>
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Organização</FormLabel>
              <FormControl>
                <Input {...field} disabled={isPending} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  disabled={isPending}
                  placeholder="Descreva sua organização..."
                  className="resize-none"
                  rows={4}
                />
              </FormControl>
              <FormDescription>
                Uma breve descrição sobre sua organização (opcional)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Slug
          </label>
          <Input value={organization.slug} disabled />
          <p className="mt-1 text-xs text-muted-foreground">
            O slug não pode ser alterado
          </p>
        </div>

        <Button type="submit" disabled={isPending}>
          {isPending ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </form>
    </Form>
  )
}
