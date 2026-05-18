import { NextRequest, NextResponse } from 'next/server'
import { getAccessTokenCookie } from '@/lib/cookies'
import { backendGenerateDocs, backendListDocsForRepo } from '@/lib/api/docs'
import { bffError } from '@/lib/api/bff-error'
import { DOC_TYPES, DocGenerationStatus, DocType, GenerateDocsRequest } from '@/lib/types/docs'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const token = await getAccessTokenCookie()
    if (!token) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as DocGenerationStatus | null

    const response = await backendListDocsForRepo(token, id, {
      status: status || undefined,
    })
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return bffError(error)
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const token = await getAccessTokenCookie()
    if (!token) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body: GenerateDocsRequest = await request.json()

    if (!Array.isArray(body.types) || body.types.length === 0) {
      return NextResponse.json(
        { error: 'invalid_request', message: 'Selecione ao menos um tipo de documentação.' },
        { status: 400 }
      )
    }
    const invalid = body.types.find((t) => !DOC_TYPES.includes(t as DocType))
    if (invalid) {
      return NextResponse.json(
        { error: 'invalid_request', message: `Tipo inválido: ${invalid}` },
        { status: 400 }
      )
    }

    const response = await backendGenerateDocs(token, id, body)
    return NextResponse.json(response, { status: 202 })
  } catch (error) {
    return bffError(error)
  }
}
