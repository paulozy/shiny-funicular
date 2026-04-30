import { NextRequest, NextResponse } from 'next/server'
import { backendGetMe } from '@/lib/api/auth'
import { getAccessTokenCookie } from '@/lib/cookies'
import { normalizeAuthError } from '@/lib/types/auth'

export async function GET(request: NextRequest) {
  try {
    const accessToken = await getAccessTokenCookie()

    if (!accessToken) {
      return NextResponse.json(
        {
          error: 'unauthorized',
          message: 'Não autorizado',
        },
        { status: 401 }
      )
    }

    const user = await backendGetMe(accessToken)

    return NextResponse.json(user, { status: 200 })
  } catch (error) {
    const normalized = normalizeAuthError(
      error instanceof Error
        ? {
            error: (error as any).statusCode === 401 ? 'unauthorized' : (error as any).errorResponse?.error || 'unknown_error',
            error_description: error.message,
          }
        : error
    )

    const statusCode = (error as any).statusCode === 401 ? 401 : 500

    return NextResponse.json(
      {
        error: normalized.code,
        message: normalized.message,
      },
      { status: statusCode }
    )
  }
}
