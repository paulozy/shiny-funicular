import { NextRequest, NextResponse } from 'next/server'
import { getAccessTokenCookie } from '@/lib/cookies'
import { backendSemanticSearch, backendSemanticSearchStream } from '@/lib/api/search'
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

    const searchRequest = {
      q,
      limit: normalizeSearchLimit(searchParams.get('limit')),
      branch: searchParams.get('branch') || undefined,
      min_score: normalizeMinScore(searchParams.get('min_score')),
    }

    if (searchParams.get('synthesize') === 'true') {
      const upstream = await backendSemanticSearchStream(token, id, searchRequest)
      const contentType = upstream.headers.get('content-type') || ''

      if (contentType.includes('text/event-stream')) {
        return new Response(upstream.body, {
          status: upstream.status,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
          },
        })
      }

      const errorBody = await upstream.json().catch(() => ({
        error: `http_${upstream.status}`,
        message: `HTTP ${upstream.status}`,
      }))
      return NextResponse.json(errorBody, { status: upstream.status })
    }

    const response = await backendSemanticSearch(token, id, searchRequest)

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
