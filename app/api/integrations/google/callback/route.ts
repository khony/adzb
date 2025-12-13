import { NextRequest, NextResponse } from 'next/server'
import { exchangeGoogleCode } from '@/lib/actions/integrations'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  // Handle OAuth errors
  if (error) {
    const errorDescription = searchParams.get('error_description') || 'Erro na autorizacao'
    return NextResponse.redirect(
      new URL(`/integrations?error=${encodeURIComponent(errorDescription)}`, request.url)
    )
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/integrations?error=Parametros+invalidos', request.url)
    )
  }

  // Decode state to get organization and provider info
  let stateData: { organizationId: string; provider: string }
  try {
    stateData = JSON.parse(Buffer.from(state, 'base64').toString())
  } catch {
    return NextResponse.redirect(
      new URL('/integrations?error=Estado+invalido', request.url)
    )
  }

  // Exchange code for tokens and save integration
  const result = await exchangeGoogleCode(code, state)

  if (result.error) {
    return NextResponse.redirect(
      new URL(`/integrations?error=${encodeURIComponent(result.error)}`, request.url)
    )
  }

  // Get organization slug to redirect properly
  // For now, redirect to a success page
  const providerSlug = stateData.provider.replace(/_/g, '-')

  return NextResponse.redirect(
    new URL(`/integrations/${providerSlug}?success=true`, request.url)
  )
}
