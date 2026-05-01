import { NextRequest, NextResponse } from 'next/server'
import { getAccessTokenCookie } from '@/lib/cookies'
import { backendGetRepositories, backendCreateRepository } from '@/lib/api/repositories'
import { CreateRepositoryRequest } from '@/lib/types/repository'
import { normalizeAuthError } from '@/lib/types/auth'

export async function GET(request: NextRequest) {
  try {
    const token = await getAccessTokenCookie()
    if (!token) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0

    const response = await backendGetRepositories(token, { limit, offset })
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

export async function POST(request: NextRequest) {
  try {
    const token = await getAccessTokenCookie()
    if (!token) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const body: CreateRepositoryRequest = await request.json()

    if (!body.url) {
      return NextResponse.json(
        {
          error: 'invalid_request',
          message: 'URL do repositório é obrigatória',
        },
        { status: 400 }
      )
    }

    const response = await backendCreateRepository(token, {
      ...body,
      is_public: body.is_public ?? (body.is_private === undefined ? undefined : !body.is_private),
    })
    return NextResponse.json(response, { status: 201 })
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
