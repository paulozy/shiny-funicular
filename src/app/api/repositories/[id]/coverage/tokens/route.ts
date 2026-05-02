import { NextRequest, NextResponse } from 'next/server'
import { getAccessTokenCookie } from '@/lib/cookies'
import {
  backendCreateCoverageToken,
  backendListCoverageTokens,
} from '@/lib/api/repositories'
import { normalizeAuthError } from '@/lib/types/auth'
import { CreateCoverageTokenRequest } from '@/lib/types/coverage'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const token = await getAccessTokenCookie()
    if (!token) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
    const { id } = await context.params
    const tokens = await backendListCoverageTokens(token, id)
    return NextResponse.json(tokens)
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const token = await getAccessTokenCookie()
    if (!token) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
    const { id } = await context.params
    const body = (await request.json().catch(() => ({}))) as CreateCoverageTokenRequest
    if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
      return NextResponse.json(
        { error: 'invalid_request', message: 'name is required' },
        { status: 400 }
      )
    }
    const created = await backendCreateCoverageToken(token, id, {
      name: body.name.trim(),
      expires_at: body.expires_at || undefined,
    })
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}

function errorResponse(error: unknown) {
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
