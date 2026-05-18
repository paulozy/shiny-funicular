import { NextRequest, NextResponse } from 'next/server'
import {
  COOKIE_ACCESS_TOKEN,
  COOKIE_REFRESH_TOKEN,
  buildAuthCookieOptions,
} from '@/lib/auth/edge-cookies'

export const config = {
  matcher: [
    '/',
    '/((?!login|register|cadastro|selecionar-organizacao|auth|_next|.*\\..*).)*',
  ],
}

interface BackendTokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  refresh_expires_in: number
}

function getBackendBaseUrl(): string {
  // The middleware runs in the Edge runtime and cannot import server-only
  // modules, so we read API_BASE_URL inline (same source used by
  // src/lib/api/*.ts). Default mirrors local dev.
  return process.env.API_BASE_URL || 'http://localhost:3000/api/v1'
}

function redirectToLogin(request: NextRequest, clearCookies = false): NextResponse {
  const response = NextResponse.redirect(new URL('/login', request.url))
  if (clearCookies) {
    // Explicit max-age=0 (vs `.cookies.delete()`) so the Set-Cookie header
    // carries the expiration directive — easier to assert in tests and to
    // inspect in DevTools.
    response.cookies.set(COOKIE_ACCESS_TOKEN, '', buildAuthCookieOptions(0))
    response.cookies.set(COOKIE_REFRESH_TOKEN, '', buildAuthCookieOptions(0))
  }
  return response
}

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Public routes — early return.
  if (
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/cadastro' ||
    pathname === '/selecionar-organizacao' ||
    pathname.startsWith('/auth/')
  ) {
    return NextResponse.next()
  }

  const accessToken = request.cookies.get(COOKIE_ACCESS_TOKEN)?.value
  if (accessToken) {
    return NextResponse.next()
  }

  // Access token is missing (expired or never present). Try to refresh
  // transparently if the refresh token is still around.
  const refreshToken = request.cookies.get(COOKIE_REFRESH_TOKEN)?.value
  if (!refreshToken) {
    return redirectToLogin(request)
  }

  let backendResponse: Response
  try {
    backendResponse = await fetch(`${getBackendBaseUrl()}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
  } catch {
    // Network error reaching the backend — do NOT destroy the refresh token,
    // the next attempt may succeed. Redirect to /login to let the user retry.
    return redirectToLogin(request)
  }

  if (backendResponse.status === 401) {
    // Refresh token was invalidated (expired, revoked, or family was burned by
    // reuse detection). Clear cookies so the user starts fresh.
    return redirectToLogin(request, true)
  }
  if (!backendResponse.ok) {
    // 5xx or unexpected status — transient, preserve the refresh token.
    return redirectToLogin(request)
  }

  let tokens: BackendTokenResponse
  try {
    tokens = (await backendResponse.json()) as BackendTokenResponse
  } catch {
    return redirectToLogin(request)
  }

  // Mutate the forwarded request so any RSC / Route Handler that runs in this
  // very request reads the freshly issued access token (instead of the stale
  // / missing cookie).
  const forwardedHeaders = new Headers(request.headers)
  const existingCookies = forwardedHeaders.get('cookie') ?? ''
  const updatedCookies = updateCookieHeader(existingCookies, {
    [COOKIE_ACCESS_TOKEN]: tokens.access_token,
    [COOKIE_REFRESH_TOKEN]: tokens.refresh_token,
  })
  forwardedHeaders.set('cookie', updatedCookies)

  const response = NextResponse.next({ request: { headers: forwardedHeaders } })
  response.cookies.set(
    COOKIE_ACCESS_TOKEN,
    tokens.access_token,
    buildAuthCookieOptions(tokens.expires_in)
  )
  response.cookies.set(
    COOKIE_REFRESH_TOKEN,
    tokens.refresh_token,
    buildAuthCookieOptions(tokens.refresh_expires_in)
  )
  return response
}

/**
 * Returns a new `Cookie` header value with the given name/value pairs
 * inserted (or replaced if already present). The input is a typical browser
 * cookie header: `name1=v1; name2=v2; …`.
 */
function updateCookieHeader(existing: string, updates: Record<string, string>): string {
  const pairs = existing
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
  const updateKeys = new Set(Object.keys(updates))
  const kept = pairs.filter((pair) => {
    const eq = pair.indexOf('=')
    const name = eq === -1 ? pair : pair.slice(0, eq)
    return !updateKeys.has(name)
  })
  for (const [name, value] of Object.entries(updates)) {
    kept.push(`${name}=${value}`)
  }
  return kept.join('; ')
}
