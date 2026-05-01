import { NextRequest, NextResponse } from 'next/server'
import { getAccessTokenCookie } from '@/lib/cookies'
import { backendSemanticSearch } from '@/lib/api/search'
import { normalizeAuthError } from '@/lib/types/auth'
import { normalizeMinScore, normalizeSearchLimit } from '@/lib/search'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const token = await getAccessTokenCookie()
    if (!token) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim() || ''

    if (!q) {
      return NextResponse.json(
        {
          error: 'invalid_request',
          message: 'Informe uma busca para pesquisar neste repositório',
        },
        { status: 400 }
      )
    }

    const response = await backendSemanticSearch(token, id, {
      q,
      limit: normalizeSearchLimit(searchParams.get('limit')),
      branch: searchParams.get('branch') || undefined,
      min_score: normalizeMinScore(searchParams.get('min_score')),
    })

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    const normalized = normalizeAuthError(
      error instanceof Error
        ? {
            error: (error as any).statusCode === 401 ? 'authentication_failed' : (error as any).errorResponse?.error || 'server_error',
            error_description: error.message,
          }
        : error
    )

    const statusCode = (error as any).statusCode || 500
    return NextResponse.json(
      {
        error: normalized.code,
        message: normalized.message,
      },
      { status: statusCode }
    )
  }
}
