import { NextRequest, NextResponse } from 'next/server'
import { getAccessTokenCookie } from '@/lib/cookies'
import { backendDeleteRelationship, backendUpdateRelationship } from '@/lib/api/graph'
import { bffError } from '@/lib/api/bff-error'
import { RELATIONSHIP_KINDS, UpdateRepositoryRelationshipRequest } from '@/lib/types/graph'

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
    const body: UpdateRepositoryRelationshipRequest = await request.json()
    if (body.kind && !RELATIONSHIP_KINDS.includes(body.kind)) {
      return NextResponse.json(
        { error: 'invalid_request', message: `Tipo inválido: ${body.kind}` },
        { status: 400 }
      )
    }

    const response = await backendUpdateRelationship(token, id, body)
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return bffError(error)
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const token = await getAccessTokenCookie()
    if (!token) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const { id } = await params
    await backendDeleteRelationship(token, id)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return bffError(error)
  }
}
