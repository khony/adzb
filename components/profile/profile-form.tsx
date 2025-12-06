'use client'

import { useState, useTransition, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { updateProfile } from '@/lib/actions/profile'
import { uploadAvatar } from '@/lib/utils/storage'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/lib/hooks/use-toast'
import { Upload } from 'lucide-react'
import type { Profile } from '@/lib/types'

const profileSchema = z.object({
  fullName: z.string().min(2).max(100),
})

interface ProfileFormProps {
  profile: Profile
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: profile.full_name || '',
    },
  })

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'Erro',
        description: 'A imagem deve ter no máximo 2MB',
        variant: 'destructive',
      })
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Erro',
        description: 'Apenas imagens são permitidas',
        variant: 'destructive',
      })
      return
    }

    setIsUploadingAvatar(true)

    const url = await uploadAvatar(file, profile.id)

    if (url) {
      setAvatarUrl(url)

      // Save to database immediately
      const formData = new FormData()
      formData.append('avatarUrl', url)

      const result = await updateProfile(formData)

      if (result.error) {
        toast({
          title: 'Erro ao salvar',
          description: result.error,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Avatar atualizado',
          description: 'Sua foto de perfil foi atualizada',
        })
      }
    } else {
      toast({
        title: 'Erro',
        description: 'Erro ao fazer upload do avatar',
        variant: 'destructive',
      })
    }

    setIsUploadingAvatar(false)
  }

  async function onSubmit(values: z.infer<typeof profileSchema>) {
    const formData = new FormData()
    formData.append('fullName', values.fullName)
    if (avatarUrl) {
      formData.append('avatarUrl', avatarUrl)
    }

    startTransition(async () => {
      const result = await updateProfile(formData)

      if (result.error) {
        toast({
          title: 'Erro',
          description: result.error,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Perfil atualizado',
          description: 'Suas informações foram atualizadas',
        })
      }
    })
  }

  const initials =
    profile.full_name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || profile.email.charAt(0).toUpperCase()

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center gap-6">
          <Avatar className="h-24 w-24">
            <AvatarImage src={avatarUrl || undefined} />
            <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
          </Avatar>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
              disabled={isUploadingAvatar}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
            >
              <Upload className="mr-2 h-4 w-4" />
              {isUploadingAvatar ? 'Fazendo upload...' : 'Alterar foto'}
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">
              JPG, PNG ou WebP. Máximo 2MB.
            </p>
          </div>
        </div>

        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Completo</FormLabel>
              <FormControl>
                <Input {...field} disabled={isPending} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Email
          </label>
          <Input value={profile.email} disabled />
          <p className="mt-1 text-xs text-muted-foreground">
            O email não pode ser alterado
          </p>
        </div>

        <Button type="submit" disabled={isPending}>
          {isPending ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </form>
    </Form>
  )
}
