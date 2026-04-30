import { NextRequest, NextResponse } from 'next/server'
import { backendOAuthCallback } from '@/lib/api/auth'
import { setAuthCookies } from '@/lib/cookies'
import { normalizeAuthError } from '@/lib/types/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (!code || !state) {
      const errorUrl = new URL('/login', request.url)
      errorUrl.searchParams.set('error', 'oauth_failed')
      return NextResponse.redirect(errorUrl)
    }

    const response = await backendOAuthCallback(provider, code, state)
    await setAuthCookies(response)

    return NextResponse.redirect(new URL('/', request.url))
  } catch (error) {
    const normalized = normalizeAuthError(
      error instanceof Error
        ? {
            error: (error as any).errorResponse?.error || 'oauth_authentication_failed',
            error_description: error.message,
          }
        : error
    )

    const errorUrl = new URL('/login', request.url)
    errorUrl.searchParams.set('error', 'oauth_failed')
    errorUrl.searchParams.set('reason', encodeURIComponent(normalized.message))

    return NextResponse.redirect(errorUrl)
  }
}
