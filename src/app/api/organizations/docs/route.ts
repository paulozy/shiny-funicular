import { NextRequest, NextResponse } from 'next/server'
import { getAccessTokenCookie } from '@/lib/cookies'
import { backendGenerateOrgDocs, backendListOrgDocs } from '@/lib/api/docs'
import { bffError } from '@/lib/api/bff-error'
import { GenerateOrgDocsRequest, ORG_DOC_TYPES, DocType } from '@/lib/types/docs'

export async function GET(_request: NextRequest) {
  try {
    const token = await getAccessTokenCookie()
    if (!token) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
    const response = await backendListOrgDocs(token)
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return bffError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getAccessTokenCookie()
    if (!token) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
    const body: GenerateOrgDocsRequest = await request.json()
    if (!Array.isArray(body.types) || body.types.length === 0) {
      return NextResponse.json(
        { error: 'invalid_request', message: 'Selecione ao menos um tipo de documentação.' },
        { status: 400 }
      )
    }
    const invalid = body.types.find((t) => !ORG_DOC_TYPES.includes(t as DocType))
    if (invalid) {
      return NextResponse.json(
        { error: 'invalid_request', message: `Tipo inválido para org: ${invalid}` },
        { status: 400 }
      )
    }
    if (body.types.includes('adr') && !body.template_id) {
      return NextResponse.json(
        {
          error: 'invalid_request',
          message: 'ADR requer um template (escolha um na galeria).',
        },
        { status: 400 }
      )
    }
    const response = await backendGenerateOrgDocs(token, body)
    return NextResponse.json(response, { status: 202 })
  } catch (error) {
    return bffError(error)
  }
}
