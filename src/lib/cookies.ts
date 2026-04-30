import { cookies } from 'next/headers'
import { TokenResponse } from './types/auth'

const COOKIE_ACCESS_TOKEN = 'access_token'
const COOKIE_REFRESH_TOKEN = 'refresh_token'
const COOKIE_LOGIN_TICKET = 'login_ticket'

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

export async function setAuthCookies(
  response: TokenResponse
): Promise<void> {
  const cookieStore = await cookies()

  const accessTokenMaxAge = response.expires_in
  const refreshTokenMaxAge = response.refresh_expires_in

  const cookieOptions = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: isProduction(),
    path: '/',
  }

  cookieStore.set(COOKIE_ACCESS_TOKEN, response.access_token, {
    ...cookieOptions,
    maxAge: accessTokenMaxAge,
  })

  cookieStore.set(COOKIE_REFRESH_TOKEN, response.refresh_token, {
    ...cookieOptions,
    maxAge: refreshTokenMaxAge,
  })
}

export async function clearAuthCookies(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_ACCESS_TOKEN)
  cookieStore.delete(COOKIE_REFRESH_TOKEN)
}

export async function setLoginTicketCookie(ticket: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_LOGIN_TICKET, ticket, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction(),
    path: '/',
    maxAge: 300,
  })
}

export async function getLoginTicketCookie(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get(COOKIE_LOGIN_TICKET)?.value
}

export async function deleteLoginTicketCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_LOGIN_TICKET)
}

export async function getAccessTokenCookie(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get(COOKIE_ACCESS_TOKEN)?.value
}

export async function getRefreshTokenCookie(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get(COOKIE_REFRESH_TOKEN)?.value
}
