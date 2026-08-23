import { NextRequest, NextResponse } from 'next/server'
import { getAccessTokenCookie } from '@/lib/cookies'
import { backendGetGraph } from '@/lib/api/graph'
import { bffError } from '@/lib/api/bff-error'
import { GraphNodeKind, RelationshipKind, RelationshipSource } from '@/lib/types/graph'

const VALID_NODE_KINDS: GraphNodeKind[] = ['repo', 'api', 'resource']

/**
 * Reads the comma-separated node kinds, dropping anything unrecognized.
 *
 * An unknown kind is dropped rather than forwarded: the backend refuses the whole
 * request for one bad value, and a typo in a bookmarked URL should degrade to the
 * default view rather than a 400.
 */
function parseNodeKinds(raw: string | null): GraphNodeKind[] | undefined {
  if (!raw) return undefined
  const kinds = raw
    .split(',')
    .map((part) => part.trim())
    .filter((part): part is GraphNodeKind => (VALID_NODE_KINDS as string[]).includes(part))
  return kinds.length > 0 ? kinds : undefined
}

export async function GET(request: NextRequest) {
  try {
    const token = await getAccessTokenCookie()
    if (!token) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const rawConfidence = searchParams.get('min_confidence')
    // The backend validates the range and refuses an unparseable value. Forwarding
    // NaN would be read as zero there, silently showing the noisiest graph to a
    // client that asked for the opposite — so a bad value is dropped here instead.
    const minConfidence =
      rawConfidence !== null && rawConfidence !== '' && !Number.isNaN(Number(rawConfidence))
        ? Number(rawConfidence)
        : undefined

    const response = await backendGetGraph(token, {
      repository_id: searchParams.get('repository_id') || undefined,
      kind: (searchParams.get('kind') as RelationshipKind) || undefined,
      source: (searchParams.get('source') as RelationshipSource) || undefined,
      node_kinds: parseNodeKinds(searchParams.get('node_kinds')),
      min_confidence: minConfidence,
      include_metadata: searchParams.get('include_metadata') !== 'false',
    })
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return bffError(error)
  }
}
