import { NextRequest, NextResponse } from 'next/server'
import { backendRefresh } from '@/lib/api/auth'
import { getRefreshTokenCookie, setAuthCookies, clearAuthCookies } from '@/lib/cookies'
import { normalizeAuthError } from '@/lib/types/auth'

export async function POST(request: NextRequest) {
  try {
    const refreshToken = await getRefreshTokenCookie()

    if (!refreshToken) {
      return NextResponse.json(
        {
          error: 'no_refresh_token',
          message: 'Sessão expirada, faça login novamente',
        },
        { status: 401 }
      )
    }

    const response = await backendRefresh(refreshToken)
    await setAuthCookies(response)

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error) {
    await clearAuthCookies()

    const normalized = normalizeAuthError(
      error instanceof Error
        ? {
            error: (error as any).errorResponse?.error || 'invalid_grant',
            error_description: error.message,
          }
        : error
    )

    return NextResponse.json(
      {
        error: normalized.code,
        message: normalized.message,
      },
      { status: 401 }
    )
  }
}
