'use client'

import { useEffect, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { keywordSchema, type KeywordInput } from '@/lib/validations/keyword'
import { createKeyword, updateKeyword } from '@/lib/actions/keywords'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/lib/hooks/use-toast'
import type { Keyword } from '@/lib/types'

interface KeywordFormProps {
  organizationId: string
  keyword?: Keyword
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function KeywordForm({
  organizationId,
  keyword,
  open,
  onOpenChange,
  onSuccess,
}: KeywordFormProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  const form = useForm<KeywordInput>({
    resolver: zodResolver(keywordSchema),
    defaultValues: {
      keyword: '',
      description: '',
      category: '',
    },
  })

  // Update form when keyword changes (for edit mode)
  useEffect(() => {
    if (keyword) {
      form.reset({
        keyword: keyword.keyword,
        description: keyword.description || '',
        category: keyword.category || '',
      })
    } else {
      form.reset({
        keyword: '',
        description: '',
        category: '',
      })
    }
  }, [keyword, form])

  async function onSubmit(values: KeywordInput) {
    const formData = new FormData()
    formData.append('keyword', values.keyword)
    if (values.description) formData.append('description', values.description)
    if (values.category) formData.append('category', values.category)

    startTransition(async () => {
      const result = keyword
        ? await updateKeyword(keyword.id, formData)
        : await createKeyword(organizationId, formData)

      if (result.error) {
        toast({
          title: 'Erro',
          description: result.error,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Sucesso',
          description: keyword ? 'Keyword atualizada' : 'Keyword criada',
        })
        onOpenChange(false)
        form.reset()
        // Refetch keywords to ensure they appear (workaround for real-time)
        onSuccess?.()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{keyword ? 'Editar' : 'Nova'} Keyword</DialogTitle>
          <DialogDescription>
            {keyword
              ? 'Atualize as informações da keyword'
              : 'Adicione uma nova keyword à sua organização'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="keyword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Keyword</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="minha-keyword"
                      {...field}
                      disabled={isPending}
                    />
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
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o que esta keyword representa..."
                      className="resize-none"
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="SEO, Marketing, etc."
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
