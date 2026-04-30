import { NextRequest, NextResponse } from 'next/server'
import { backendSelectOrg } from '@/lib/api/auth'
import { setAuthCookies, getLoginTicketCookie, deleteLoginTicketCookie } from '@/lib/cookies'
import { normalizeAuthError, SelectOrganizationRequest } from '@/lib/types/auth'

export async function POST(request: NextRequest) {
  try {
    const body: SelectOrganizationRequest = await request.json()
    const loginTicket = await getLoginTicketCookie()

    if (!loginTicket) {
      return NextResponse.json(
        {
          error: 'no_ticket',
          message: 'Sessão expirada, faça login novamente',
        },
        { status: 401 }
      )
    }

    if (!body.organization_id) {
      return NextResponse.json(
        {
          error: 'invalid_request',
          message: 'ID da organização é obrigatório',
        },
        { status: 400 }
      )
    }

    const response = await backendSelectOrg({
      login_ticket: loginTicket,
      organization_id: body.organization_id,
    })

    await setAuthCookies(response)
    await deleteLoginTicketCookie()

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
            error: (error as any).statusCode === 401 ? 'organization_selection_failed' : (error as any).errorResponse?.error || 'invalid_request',
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
