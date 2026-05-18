import { NextRequest, NextResponse } from 'next/server'
import { getAccessTokenCookie } from '@/lib/cookies'
import { backendGetGraph } from '@/lib/api/graph'
import { bffError } from '@/lib/api/bff-error'
import { RelationshipKind, RelationshipSource } from '@/lib/types/graph'

export async function GET(request: NextRequest) {
  try {
    const token = await getAccessTokenCookie()
    if (!token) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const response = await backendGetGraph(token, {
      repository_id: searchParams.get('repository_id') || undefined,
      kind: (searchParams.get('kind') as RelationshipKind) || undefined,
      source: (searchParams.get('source') as RelationshipSource) || undefined,
      include_metadata: searchParams.get('include_metadata') !== 'false',
    })
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return bffError(error)
  }
}
