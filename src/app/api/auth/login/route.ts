import { NextRequest, NextResponse } from 'next/server'
import { backendLogin } from '@/lib/api/auth'
import { setAuthCookies, setLoginTicketCookie } from '@/lib/cookies'
import { normalizeAuthError, LoginRequest, OrganizationSelectionResponse } from '@/lib/types/auth'

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json()

    if (!body.email || !body.password) {
      return NextResponse.json(
        {
          error: 'invalid_request',
          message: 'Email e senha são obrigatórios',
        },
        { status: 400 }
      )
    }

    const response = await backendLogin(body)

    if ('requires_organization_selection' in response) {
      const selectionResponse = response as OrganizationSelectionResponse
      await setLoginTicketCookie(selectionResponse.login_ticket)

      return NextResponse.json(
        {
          requires_organization_selection: true,
          organizations: selectionResponse.organizations,
        },
        { status: 202 }
      )
    }

    await setAuthCookies(response)

    return NextResponse.json(
      {
        user: response.user,
        organization: response.organization,
      },
      { status: 200 }
    )
  } catch (error) {
    const normalized = normalizeAuthError(
      error instanceof Error
        ? {
            error: (error as any).statusCode === 401 ? 'authentication_failed' : (error as any).errorResponse?.error || 'invalid_request',
            error_description: error.message,
          }
        : error
    )

    const statusCode = (error as any).statusCode === 401 ? 401 : 400

    return NextResponse.json(
      {
        error: normalized.code,
        message: normalized.message,
      },
      { status: statusCode }
    )
  }
}
