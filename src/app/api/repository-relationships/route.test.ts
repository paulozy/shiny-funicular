import { POST } from './route'
import { NextRequest } from 'next/server'
import * as cookies from '@/lib/cookies'
import * as graph from '@/lib/api/graph'

jest.mock('@/lib/cookies')
jest.mock('@/lib/api/graph')

function post(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/repository-relationships', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

const validBody = {
  source_repository_id: 'r1',
  target_repository_id: 'r2',
  kind: 'http',
}

describe('/api/repository-relationships', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(cookies.getAccessTokenCookie as jest.Mock).mockResolvedValue('token')
    ;(graph.backendCreateRelationship as jest.Mock).mockResolvedValue({
      id: 'edge-1',
      source: 'repo:r1',
      target: 'repo:r2',
      kind: 'http',
      provenance: 'manual',
      confidence: 1,
    })
  })

  it('returns 401 without an access token', async () => {
    ;(cookies.getAccessTokenCookie as jest.Mock).mockResolvedValue(null)

    const res = await POST(post(validBody))
    expect(res.status).toBe(401)
  })

  it('creates the relationship and returns 201', async () => {
    const res = await POST(post(validBody))

    expect(res.status).toBe(201)
    expect((await res.json()).id).toBe('edge-1')
    expect(graph.backendCreateRelationship).toHaveBeenCalledWith('token', validBody)
  })

  it('rejects a missing endpoint', async () => {
    const res = await POST(post({ ...validBody, target_repository_id: '' }))
    expect(res.status).toBe(400)
    expect(graph.backendCreateRelationship).not.toHaveBeenCalled()
  })

  it('rejects a self relationship', async () => {
    const res = await POST(post({ ...validBody, target_repository_id: 'r1' }))
    expect(res.status).toBe(400)
    expect(graph.backendCreateRelationship).not.toHaveBeenCalled()
  })

  // `provides` and `uses` are synthesized from the API and resource tables.
  // Accepting one here would let a person hand-write a second, competing copy of a
  // fact the platform already derives.
  it('refuses the derived-only kinds', async () => {
    for (const kind of ['provides', 'uses']) {
      const res = await POST(post({ ...validBody, kind }))
      expect(res.status).toBe(400)
    }
    expect(graph.backendCreateRelationship).not.toHaveBeenCalled()
  })

  it('accepts every kind a person may declare', async () => {
    for (const kind of ['http', 'async', 'library', 'data', 'infra', 'manual', 'other']) {
      const res = await POST(post({ ...validBody, kind }))
      expect(res.status).toBe(201)
    }
  })
})
