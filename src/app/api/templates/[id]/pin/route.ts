import { NextRequest, NextResponse } from 'next/server'
import { getAccessTokenCookie } from '@/lib/cookies'
import { backendPinTemplate } from '@/lib/api/templates'
import { bffError } from '@/lib/api/bff-error'
import { PinTemplateRequest } from '@/lib/types/template'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const token = await getAccessTokenCookie()
    if (!token) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body: PinTemplateRequest = await request.json()

    if (typeof body.is_pinned !== 'boolean') {
      return NextResponse.json(
        { error: 'invalid_request', message: 'is_pinned é obrigatório.' },
        { status: 400 }
      )
    }

    const response = await backendPinTemplate(token, id, body)
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return bffError(error)
  }
}
