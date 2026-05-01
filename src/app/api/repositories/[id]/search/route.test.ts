import { GET } from './route'
import { NextRequest } from 'next/server'
import * as cookies from '@/lib/cookies'
import * as search from '@/lib/api/search'

jest.mock('@/lib/cookies')
jest.mock('@/lib/api/search')

describe('/api/repositories/[id]/search', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 401 if no access token', async () => {
    ;(cookies.getAccessTokenCookie as jest.Mock).mockResolvedValue(null)

    const req = new NextRequest('http://localhost:3000/api/repositories/repo-1/search?q=auth')
    const res = await GET(req, { params: Promise.resolve({ id: 'repo-1' }) })
    const data = await res.json()

    expect(res.status).toBe(401)
    expect(data.error).toBe('unauthorized')
  })

  it('returns 400 if query is missing', async () => {
    ;(cookies.getAccessTokenCookie as jest.Mock).mockResolvedValue('valid-token')

    const req = new NextRequest('http://localhost:3000/api/repositories/repo-1/search')
    const res = await GET(req, { params: Promise.resolve({ id: 'repo-1' }) })
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.error).toBe('invalid_request')
  })

  it('passes normalized parameters to backend search', async () => {
    const response = {
      query: 'auth',
      total: 0,
      results: [],
    }

    ;(cookies.getAccessTokenCookie as jest.Mock).mockResolvedValue('valid-token')
    ;(search.backendSemanticSearch as jest.Mock).mockResolvedValue(response)

    const req = new NextRequest('http://localhost:3000/api/repositories/repo-1/search?q=auth&limit=50&branch=main&min_score=0.7')
    const res = await GET(req, { params: Promise.resolve({ id: 'repo-1' }) })
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data).toEqual(response)
    expect(search.backendSemanticSearch).toHaveBeenCalledWith('valid-token', 'repo-1', {
      q: 'auth',
      limit: 50,
      branch: 'main',
      min_score: 0.7,
    })
  })

  it('proxies SSE search streams when synthesis is requested', async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('event: done\ndata: {"cached":false}\n\n'))
        controller.close()
      },
    })
    const upstream = new Response(stream, {
      status: 200,
      headers: { 'Content-Type': 'text/event-stream' },
    })

    ;(cookies.getAccessTokenCookie as jest.Mock).mockResolvedValue('valid-token')
    ;(search.backendSemanticSearchStream as jest.Mock).mockResolvedValue(upstream)

    const req = new NextRequest('http://localhost:3000/api/repositories/repo-1/search?q=auth&limit=50&branch=main&min_score=0.7&synthesize=true')
    const res = await GET(req, { params: Promise.resolve({ id: 'repo-1' }) })
    const body = await res.text()

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('text/event-stream')
    expect(body).toContain('event: done')
    expect(search.backendSemanticSearchStream).toHaveBeenCalledWith('valid-token', 'repo-1', {
      q: 'auth',
      limit: 50,
      branch: 'main',
      min_score: 0.7,
    })
    expect(search.backendSemanticSearch).not.toHaveBeenCalled()
  })

  it('returns upstream JSON errors before opening an SSE stream', async () => {
    const upstream = Response.json(
      { error: 'anthropic_budget_exceeded', error_description: 'budget exceeded' },
      { status: 429 }
    )

    ;(cookies.getAccessTokenCookie as jest.Mock).mockResolvedValue('valid-token')
    ;(search.backendSemanticSearchStream as jest.Mock).mockResolvedValue(upstream)

    const req = new NextRequest('http://localhost:3000/api/repositories/repo-1/search?q=auth&synthesize=true')
    const res = await GET(req, { params: Promise.resolve({ id: 'repo-1' }) })
    const data = await res.json()

    expect(res.status).toBe(429)
    expect(data.error).toBe('anthropic_budget_exceeded')
  })

  it('propagates backend errors', async () => {
    const err = new Error('embedding provider is not configured')
    ;(err as any).statusCode = 503
    ;(err as any).errorResponse = { error: 'embeddings_unavailable' }

    ;(cookies.getAccessTokenCookie as jest.Mock).mockResolvedValue('valid-token')
    ;(search.backendSemanticSearch as jest.Mock).mockRejectedValue(err)

    const req = new NextRequest('http://localhost:3000/api/repositories/repo-1/search?q=auth')
    const res = await GET(req, { params: Promise.resolve({ id: 'repo-1' }) })
    const data = await res.json()

    expect(res.status).toBe(503)
    expect(data.error).toBe('embeddings_unavailable')
  })
})
