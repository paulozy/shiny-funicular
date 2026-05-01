import { NextRequest, NextResponse } from 'next/server'
import { getAccessTokenCookie } from '@/lib/cookies'
import { backendGenerateEmbeddings } from '@/lib/api/search'
import { normalizeAuthError } from '@/lib/types/auth'
import { GenerateEmbeddingsRequest } from '@/lib/types/search'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, context: RouteContext) {
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
