import { GET } from './route'
import { NextRequest } from 'next/server'
import * as cookies from '@/lib/cookies'
import * as graph from '@/lib/api/graph'

jest.mock('@/lib/cookies')
jest.mock('@/lib/api/graph')

const emptyGraph = { nodes: [], edges: [] }

function request(query = ''): NextRequest {
  return new NextRequest(`http://localhost:3000/api/repositories/graph${query}`)
}

describe('/api/repositories/graph', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(cookies.getAccessTokenCookie as jest.Mock).mockResolvedValue('token')
    ;(graph.backendGetGraph as jest.Mock).mockResolvedValue(emptyGraph)
  })

  it('returns 401 without an access token', async () => {
    ;(cookies.getAccessTokenCookie as jest.Mock).mockResolvedValue(null)

    const res = await GET(request())
    expect(res.status).toBe(401)
    expect((await res.json()).error).toBe('unauthorized')
  })

  it('returns the graph payload', async () => {
    const payload = {
      nodes: [{ id: 'repo:r1', kind: 'repo', name: 'orders', url: 'u', type: 'github' }],
      edges: [],
    }
    ;(graph.backendGetGraph as jest.Mock).mockResolvedValue(payload)

    const res = await GET(request())
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(payload)
  })

  it('forwards the node kinds and the confidence threshold', async () => {
    await GET(request('?node_kinds=repo,resource&min_confidence=0.85'))

    expect(graph.backendGetGraph).toHaveBeenCalledWith(
      'token',
      expect.objectContaining({
        node_kinds: ['repo', 'resource'],
        min_confidence: 0.85,
      })
    )
  })

  // A typo in a bookmarked URL should degrade to the default view rather than a
  // 400 — the backend refuses the whole request for one bad value.
  it('drops an unrecognized node kind instead of forwarding it', async () => {
    await GET(request('?node_kinds=repo,component'))

    expect(graph.backendGetGraph).toHaveBeenCalledWith(
      'token',
      expect.objectContaining({ node_kinds: ['repo'] })
    )
  })

  it('omits node_kinds entirely when none survive, so the server default applies', async () => {
    await GET(request('?node_kinds=component'))

    expect(graph.backendGetGraph).toHaveBeenCalledWith(
      'token',
      expect.objectContaining({ node_kinds: undefined })
    )
  })

  // Forwarding NaN would be read as zero downstream, silently showing the noisiest
  // graph to a client that asked for the opposite.
  it('drops an unparseable confidence threshold', async () => {
    await GET(request('?min_confidence=abc'))

    expect(graph.backendGetGraph).toHaveBeenCalledWith(
      'token',
      expect.objectContaining({ min_confidence: undefined })
    )
  })

  it('defaults include_metadata to true and honours an explicit false', async () => {
    await GET(request())
    expect(graph.backendGetGraph).toHaveBeenCalledWith(
      'token',
      expect.objectContaining({ include_metadata: true })
    )

    await GET(request('?include_metadata=false'))
    expect(graph.backendGetGraph).toHaveBeenLastCalledWith(
      'token',
      expect.objectContaining({ include_metadata: false })
    )
  })
})
