import { NextRequest, NextResponse } from 'next/server'
import { backendRegister } from '@/lib/api/auth'
import { setAuthCookies } from '@/lib/cookies'
import { normalizeAuthError, RegisterRequest } from '@/lib/types/auth'

export async function POST(request: NextRequest) {
  try {
    const body: RegisterRequest = await request.json()

    if (!body.email || !body.full_name || !body.password) {
      return NextResponse.json(
        {
          error: 'invalid_request',
          message: 'Email, nome e senha são obrigatórios',
        },
        { status: 400 }
      )
    }

    // Registration has two shapes: create an organization, which needs a name,
    // or join one with an invite, which needs the token and no name at all.
    // Requiring the name unconditionally — as this did, from before invites
    // existed — made accepting an invite through the UI impossible.
    if (!body.invite_token && !body.organization_name) {
      return NextResponse.json(
        {
          error: 'invalid_request',
          message: 'Informe o nome da organização ou um convite',
        },
        { status: 400 }
      )
    }

    if (body.password.length < 8) {
      return NextResponse.json(
        {
          error: 'invalid_request',
          message: 'Senha deve ter pelo menos 8 caracteres',
        },
        { status: 400 }
      )
    }

    const response = await backendRegister(body)
    await setAuthCookies(response)

    return NextResponse.json(
      {
        user: response.user,
        organization: response.organization,
      },
      { status: 201 }
    )
  } catch (error) {
    const normalized = normalizeAuthError(
      error instanceof Error
        ? {
            error: (error as any).errorResponse?.error || 'registration_failed',
            error_description: error.message,
          }
        : error
    )

    return NextResponse.json(
      {
        error: normalized.code,
        message: normalized.message,
      },
      { status: 400 }
    )
  }
}
