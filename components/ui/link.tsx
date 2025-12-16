'use client'

import NextLink from 'next/link'
import { useLocale } from 'next-intl'
import { ComponentProps } from 'react'

type LinkProps = ComponentProps<typeof NextLink>

export function Link({ href, ...props }: LinkProps) {
  const locale = useLocale()

  // If href is a string and doesn't start with http/https, add locale prefix
  const localizedHref =
    typeof href === 'string' && !href.startsWith('http')
      ? `/${locale}${href.startsWith('/') ? href : `/${href}`}`
      : href

  return <NextLink href={localizedHref} {...props} />
}
