import { NextRequest, NextResponse } from 'next/server'
import { getAccessTokenCookie } from '@/lib/cookies'
import { backendGetOrganizationConfig, backendUpdateOrganizationConfig } from '@/lib/api/organization'
import { UpdateOrganizationConfigRequest } from '@/lib/types/organization'
import { normalizeAuthError } from '@/lib/types/auth'

export async function GET(request: NextRequest) {
  try {
    const token = await getAccessTokenCookie()
    if (!token) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const response = await backendGetOrganizationConfig(token)
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    const statusCode = (error as any).statusCode || 500

    if (statusCode === 403) {
      return NextResponse.json(
        { error: 'forbidden', message: 'Acesso não autorizado' },
        { status: 403 }
      )
    }

    const normalized = normalizeAuthError(
      error instanceof Error
        ? {
            error: statusCode === 401 ? 'authentication_failed' : (error as any).errorResponse?.error || 'server_error',
            error_description: error.message,
          }
        : error
    )

    return NextResponse.json(
      {
        error: normalized.code,
        message: normalized.message,
      },
      { status: statusCode }
    )
  }
}

async function updateConfig(request: NextRequest) {
  try {
    const token = await getAccessTokenCookie()
    if (!token) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const body: UpdateOrganizationConfigRequest = await request.json()

    const response = await backendUpdateOrganizationConfig(token, body)
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    const statusCode = (error as any).statusCode || 500

    if (statusCode === 403) {
      return NextResponse.json(
        { error: 'forbidden', message: 'Acesso não autorizado' },
        { status: 403 }
      )
    }

    const normalized = normalizeAuthError(
      error instanceof Error
        ? {
            error: statusCode === 401 ? 'authentication_failed' : (error as any).errorResponse?.error || 'server_error',
            error_description: error.message,
          }
        : error
    )

    return NextResponse.json(
      {
        error: normalized.code,
        message: normalized.message,
      },
      { status: statusCode }
    )
  }
}

export async function PATCH(request: NextRequest) {
  return updateConfig(request)
}

export async function PUT(request: NextRequest) {
  return updateConfig(request)
}
