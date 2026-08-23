import { NextRequest, NextResponse } from 'next/server'
import { getAccessTokenCookie } from '@/lib/cookies'
import { backendCreateManualRepoDoc } from '@/lib/api/docs'
import { bffError } from '@/lib/api/bff-error'
import { DOC_TYPES, CreateManualDocRequest, DocType } from '@/lib/types/docs'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * Store a hand-written document for a repository.
 *
 * A sibling of the generation route rather than a mode of it: a plain POST to
 * the docs collection has meant "generate" since it shipped, and generation
 * can answer 503/429/409 for reasons that have nothing to do with writing a
 * document by hand.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const token = await getAccessTokenCookie()
    if (!token) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body: CreateManualDocRequest = await request.json()

    if (!DOC_TYPES.includes(body.type as DocType)) {
      return NextResponse.json(
        { error: 'invalid_request', message: `Tipo inválido: ${body.type}` },
        { status: 400 }
      )
    }
    if (typeof body.content !== 'string' || body.content.trim() === '') {
      return NextResponse.json(
        { error: 'invalid_request', message: 'Escreva o conteúdo do documento.' },
        { status: 400 }
      )
    }

    const response = await backendCreateManualRepoDoc(token, id, body)
    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    return bffError(error)
  }
}
