import { NextRequest, NextResponse } from 'next/server'
import { getAccessTokenCookie } from '@/lib/cookies'
import { backendCreateRelationship } from '@/lib/api/graph'
import { bffError } from '@/lib/api/bff-error'
import { CreateRepositoryRelationshipRequest, RELATIONSHIP_KINDS } from '@/lib/types/graph'

export async function POST(request: NextRequest) {
  try {
    const token = await getAccessTokenCookie()
    if (!token) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const body: CreateRepositoryRelationshipRequest = await request.json()
    if (!body.source_repository_id || !body.target_repository_id) {
      return NextResponse.json(
        { error: 'invalid_request', message: 'Origem e destino são obrigatórios.' },
        { status: 400 }
      )
    }
    if (body.source_repository_id === body.target_repository_id) {
      return NextResponse.json(
        { error: 'invalid_request', message: 'Origem e destino não podem ser o mesmo repositório.' },
        { status: 400 }
      )
    }
    if (!RELATIONSHIP_KINDS.includes(body.kind)) {
      return NextResponse.json(
        { error: 'invalid_request', message: `Tipo inválido: ${body.kind}` },
        { status: 400 }
      )
    }

    const response = await backendCreateRelationship(token, body)
    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    return bffError(error)
  }
}
