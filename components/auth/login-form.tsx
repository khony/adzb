'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { loginUser } from '@/lib/actions/auth'
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

export function LoginForm() {
  const t = useTranslations()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const loginSchema = z.object({
    email: z.string().email({ message: t('validation.emailInvalid') }),
    password: z.string().min(1, { message: t('validation.passwordRequired') }),
  })

  type LoginInput = z.infer<typeof loginSchema>

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  async function onSubmit(values: LoginInput) {
    setError(null)

    const formData = new FormData()
    formData.append('email', values.email)
    formData.append('password', values.password)

    startTransition(async () => {
      const result = await loginUser(formData)
      if (result?.error) {
        setError(result.error)
      }
    })
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">{t('auth.login.title')}</h1>
        <p className="text-muted-foreground">
          {t('auth.login.subtitle')}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('auth.login.email')}</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder={t('auth.login.emailPlaceholder')}
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
                <FormLabel>{t('auth.login.password')}</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder={t('auth.login.passwordPlaceholder')}
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
            {isPending ? t('auth.login.submitting') : t('auth.login.submit')}
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm">
        {t('auth.login.noAccount')}{' '}
        <Link href="/register" className="font-medium underline underline-offset-4">
          {t('auth.login.signUp')}
        </Link>
      </div>
    </div>
  )
}
