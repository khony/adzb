'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { registerUser } from '@/lib/actions/auth'
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
import { Link } from '@/components/ui/link'
import { useTranslations } from 'next-intl'

export function RegisterForm() {
  const t = useTranslations()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const registerSchema = z.object({
    email: z.string().email({ message: t('validation.emailInvalid') }),
    password: z.string().min(8, { message: t('validation.passwordMinLength', { min: 8 }) }),
    fullName: z.string().min(2, { message: t('validation.nameMinLength', { min: 2 }) }),
  })

  type RegisterInput = z.infer<typeof registerSchema>

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      fullName: '',
    },
  })

  async function onSubmit(values: RegisterInput) {
    setError(null)

    const formData = new FormData()
    formData.append('email', values.email)
    formData.append('password', values.password)
    formData.append('fullName', values.fullName)

    startTransition(async () => {
      const result = await registerUser(formData)
      if (result?.error) {
        setError(result.error)
      }
    })
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">{t('auth.register.title')}</h1>
        <p className="text-muted-foreground">
          {t('auth.register.subtitle')}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('auth.register.fullName')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('auth.register.fullNamePlaceholder')}
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
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('auth.register.email')}</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder={t('auth.register.emailPlaceholder')}
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
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('auth.register.password')}</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder={t('auth.register.passwordPlaceholder')}
                    {...field}
                    disabled={isPending}
                  />
                </FormControl>
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
            {isPending ? t('auth.register.submitting') : t('auth.register.submit')}
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm">
        {t('auth.register.hasAccount')}{' '}
        <Link href="/login" className="font-medium underline underline-offset-4">
          {t('auth.register.signIn')}
        </Link>
      </div>
    </div>
  )
}
