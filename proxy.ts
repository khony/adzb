import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { locales, defaultLocale, type Locale } from './i18n/config'

function getLocaleFromPath(pathname: string): Locale | null {
  const segments = pathname.split('/')
  const potentialLocale = segments[1]
  if (locales.includes(potentialLocale as Locale)) {
    return potentialLocale as Locale
  }
  return null
}

function getLocaleFromHeaders(request: NextRequest): Locale {
  const acceptLanguage = request.headers.get('accept-language')
  if (acceptLanguage) {
    const preferredLocale = acceptLanguage
      .split(',')
      .map((lang) => lang.split(';')[0].trim().substring(0, 2))
      .find((lang) => locales.includes(lang as Locale))
    if (preferredLocale) {
      return preferredLocale as Locale
    }
  }
  return defaultLocale
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Check if pathname already has a locale
  const pathnameLocale = getLocaleFromPath(pathname)

  // If no locale in path, redirect to add locale
  if (!pathnameLocale) {
    const locale = getLocaleFromHeaders(request)
    const newUrl = new URL(`/${locale}${pathname}`, request.url)
    newUrl.search = request.nextUrl.search
    return NextResponse.redirect(newUrl)
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get the path without locale prefix for route matching
  const pathWithoutLocale = pathname.replace(`/${pathnameLocale}`, '') || '/'

  // Public routes (without locale prefix)
  const isAuthRoute =
    pathWithoutLocale.startsWith('/login') ||
    pathWithoutLocale.startsWith('/register') ||
    pathWithoutLocale.startsWith('/api/auth')

  // If not authenticated and trying to access protected route
  if (!user && !isAuthRoute && pathWithoutLocale !== '/') {
    return NextResponse.redirect(new URL(`/${pathnameLocale}/login`, request.url))
  }

  // If authenticated and trying to access auth route
  if (user && (pathWithoutLocale === '/login' || pathWithoutLocale === '/register' || pathWithoutLocale === '/')) {
    // Check if user has an organization
    const { data: orgs } = await supabase
      .from('organization_members')
      .select('organization_id, organizations(slug)')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    if (orgs && orgs.organizations) {
      const slug = Array.isArray(orgs.organizations)
        ? orgs.organizations[0].slug
        : (orgs.organizations as any).slug
      return NextResponse.redirect(
        new URL(`/${pathnameLocale}/${slug}/dashboard`, request.url)
      )
    } else {
      return NextResponse.redirect(new URL(`/${pathnameLocale}/onboarding`, request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
