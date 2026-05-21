import { NextRequest, NextResponse } from 'next/server'
import { getAccessTokenCookie } from '@/lib/cookies'
import { backendGenerateEmbeddings } from '@/lib/api/search'
import { normalizeAuthError } from '@/lib/types/auth'
import { GenerateEmbeddingsRequest } from '@/lib/types/search'
import { BackendError } from '@/lib/api/_shared'
import { withTraceId } from '@/lib/logger'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  const log = withTraceId(request.headers)
  try {
    const token = await getAccessTokenCookie()
    if (!token) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const body = (await request.json().catch(() => ({}))) as GenerateEmbeddingsRequest
    const response = await backendGenerateEmbeddings(token, id, {
      branch: body.branch || undefined,
      commit_sha: body.commit_sha || undefined,
    })

    return NextResponse.json(response, { status: 202 })
  } catch (error) {
    // Two shapes can land here:
    // - BackendError from helpers that already moved to _shared.ts.
    // - A plain Error carrying ad-hoc { statusCode, errorResponse } props from
    //   the legacy helpers in search.ts (not yet migrated). Keep both working
    //   so this route preserves its existing contract.
    const isBackend = error instanceof BackendError
    const legacy = error as { statusCode?: number; errorResponse?: { error?: string } }
    const statusCode = isBackend ? error.statusCode : legacy.statusCode || 500
    const backendCode = isBackend ? error.errorResponse?.error : legacy.errorResponse?.error
    const message = error instanceof Error ? error.message : 'unknown_error'

    log.error(
      { status: statusCode, error_code: backendCode, kind: isBackend ? 'backend' : 'legacy' },
      'embeddings_route_error'
    )

    const normalized = normalizeAuthError({
      error: statusCode === 401 ? 'authentication_failed' : backendCode || 'server_error',
      error_description: message,
    })
    return NextResponse.json(
      { error: normalized.code, message: normalized.message },
      { status: statusCode }
    )
  }
}
