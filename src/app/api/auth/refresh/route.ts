import { NextRequest, NextResponse } from 'next/server'
import { backendRefresh } from '@/lib/api/auth'
import { getRefreshTokenCookie, setAuthCookies, clearAuthCookies } from '@/lib/cookies'
import { normalizeAuthError } from '@/lib/types/auth'

export async function POST(_request: NextRequest) {
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
    type ErrorWithStatus = {
      statusCode?: number
      errorResponse?: { error?: string }
    }
    const err = error as ErrorWithStatus
    const statusCode = err.statusCode ?? 500

    // Only clear cookies when the backend explicitly says the refresh token
    // is no longer valid (401). For transient errors (5xx, network) keep the
    // refresh token so the user can retry without re-authenticating.
    if (statusCode === 401) {
      await clearAuthCookies()
      const normalized = normalizeAuthError(
        error instanceof Error
          ? {
              error: err.errorResponse?.error || 'invalid_grant',
              error_description: error.message,
            }
          : error
      )
      return NextResponse.json(
        { error: normalized.code, message: normalized.message },
        { status: 401 }
      )
    }

    // Transient failure — backend unreachable or 5xx. Surface a 502 so the
    // SPA client knows this was *not* a credential failure and the session
    // is still recoverable on the next attempt.
    return NextResponse.json(
      {
        error: 'refresh_unavailable',
        message: 'Não foi possível renovar a sessão agora. Tente novamente.',
      },
      { status: 502 }
    )
  }
}
