import { NextRequest, NextResponse } from 'next/server'
import { getAccessTokenCookie } from '@/lib/cookies'
import { backendCreateManualOrgDoc } from '@/lib/api/docs'
import { bffError } from '@/lib/api/bff-error'
import { ORG_DOC_TYPES, CreateManualDocRequest, DocType } from '@/lib/types/docs'

/**
 * Store a hand-written organization-wide document.
 *
 * `service_doc` is rejected here as it is on the backend: a service document
 * describes one service, so there is nothing for it to mean org-wide.
 */
export async function POST(request: NextRequest) {
  try {
    const token = await getAccessTokenCookie()
    if (!token) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const body: CreateManualDocRequest = await request.json()

    if (!ORG_DOC_TYPES.includes(body.type as DocType)) {
      return NextResponse.json(
        { error: 'invalid_request', message: `Tipo inválido para documentação da organização: ${body.type}` },
        { status: 400 }
      )
    }
    if (typeof body.content !== 'string' || body.content.trim() === '') {
      return NextResponse.json(
        { error: 'invalid_request', message: 'Escreva o conteúdo do documento.' },
        { status: 400 }
      )
    }

    const response = await backendCreateManualOrgDoc(token, body)
    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    return bffError(error)
  }
}
