'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createOrgSchema, type CreateOrgInput } from '@/lib/validations/organization'
import { createOrganization } from '@/lib/actions/organizations'
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

export function OnboardingForm() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const form = useForm<CreateOrgInput>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: {
      name: '',
    },
  })

  async function onSubmit(values: CreateOrgInput) {
    setError(null)

    const formData = new FormData()
    formData.append('name', values.name)

    startTransition(async () => {
      const result = await createOrganization(formData)
      if (result?.error) {
        setError(result.error)
      }
    })
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Crie sua Organização</h1>
        <p className="text-muted-foreground">
          Vamos começar criando sua primeira organização
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome da Organização</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Minha Empresa"
                    {...field}
                    disabled={isPending}
                  />
                </FormControl>
                <FormDescription>
                  Este será o nome da sua primeira organização
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Criando...' : 'Criar Organização'}
          </Button>
        </form>
      </Form>
    </div>
  )
}
