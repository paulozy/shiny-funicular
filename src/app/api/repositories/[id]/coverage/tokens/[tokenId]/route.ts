import { NextRequest, NextResponse } from 'next/server'
import { getAccessTokenCookie } from '@/lib/cookies'
import { backendRevokeCoverageToken } from '@/lib/api/repositories'
import { normalizeAuthError } from '@/lib/types/auth'

interface RouteContext {
  params: Promise<{ id: string; tokenId: string }>
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const token = await getAccessTokenCookie()
    if (!token) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
    const { id, tokenId } = await context.params
    await backendRevokeCoverageToken(token, id, tokenId)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    const normalized = normalizeAuthError(
      error instanceof Error
        ? {
            error:
              (error as any).statusCode === 401
                ? 'authentication_failed'
                : (error as any).errorResponse?.error || 'server_error',
            error_description: error.message,
          }
        : error
    )
    const statusCode = (error as any)?.statusCode || 500
    return NextResponse.json(
      { error: normalized.code, message: normalized.message },
      { status: statusCode }
    )
  }
}
