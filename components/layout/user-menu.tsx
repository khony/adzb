'use client'

import { useTransition } from 'react'
import { useTheme } from 'next-themes'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { LogOut, Moon, Sun, User as UserIcon, Globe } from 'lucide-react'
import { logoutUser } from '@/lib/actions/auth'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { locales, type Locale } from '@/i18n/config'
import type { Profile } from '@/lib/types'

const localeLabels: Record<Locale, string> = {
  pt: 'Portugues',
  en: 'English',
  es: 'Espanol',
}

const localeFlags: Record<Locale, string> = {
  pt: '🇧🇷',
  en: '🇺🇸',
  es: '🇪🇸',
}

interface UserMenuProps {
  user: Profile
}

export function UserMenu({ user }: UserMenuProps) {
  const router = useRouter()
  const locale = useLocale() as Locale
  const [isPending, startTransition] = useTransition()
  const { theme, setTheme } = useTheme()
  const t = useTranslations('userMenu')
  const pathname = usePathname()

  const handleLogout = () => {
    startTransition(async () => {
      await logoutUser()
    })
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const switchLocale = (newLocale: Locale) => {
    const segments = pathname.split('/')
    segments[1] = newLocale
    const newPath = segments.join('/')
    router.push(newPath)
  }

  const initials = user.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || user.email.charAt(0).toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-full justify-start gap-2 px-2">
          <Avatar className="h-7 w-7">
            <AvatarImage src={user.avatar_url || undefined} alt={user.full_name || user.email} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start text-sm">
            <span className="font-medium">{user.full_name || t('user')}</span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.full_name || t('user')}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push(`/${locale}/profile`)} className="cursor-pointer">
          <UserIcon className="mr-2 h-4 w-4" />
          {t('profile')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer">
          {theme === 'dark' ? (
            <>
              <Sun className="mr-2 h-4 w-4" />
              {t('lightMode')}
            </>
          ) : (
            <>
              <Moon className="mr-2 h-4 w-4" />
              {t('darkMode')}
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="cursor-pointer">
            <Globe className="mr-2 h-4 w-4" />
            {localeFlags[locale]} {localeLabels[locale]}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {locales.map((loc) => (
              <DropdownMenuItem
                key={loc}
                onClick={() => switchLocale(loc)}
                className="cursor-pointer"
              >
                {localeFlags[loc]} {localeLabels[loc]}
                {locale === loc && ' ✓'}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          disabled={isPending}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          {isPending ? t('signingOut') : t('signOut')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
