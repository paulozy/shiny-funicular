import { POST } from './route'
import { NextRequest } from 'next/server'
import * as cookies from '@/lib/cookies'
import * as search from '@/lib/api/search'

jest.mock('@/lib/cookies')
jest.mock('@/lib/api/search')

describe('/api/repositories/[id]/embeddings', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 401 if no access token', async () => {
    ;(cookies.getAccessTokenCookie as jest.Mock).mockResolvedValue(null)

    const req = new NextRequest('http://localhost:3000/api/repositories/repo-1/embeddings', {
      method: 'POST',
      body: JSON.stringify({ branch: 'main' }),
    })
    const res = await POST(req, { params: Promise.resolve({ id: 'repo-1' }) })
    const data = await res.json()

    expect(res.status).toBe(401)
    expect(data.error).toBe('unauthorized')
  })

  it('queues embeddings generation', async () => {
    const response = {
      status: 'queued',
      type: 'embeddings:generate',
      target: 'repo-1',
    }

    ;(cookies.getAccessTokenCookie as jest.Mock).mockResolvedValue('valid-token')
    ;(search.backendGenerateEmbeddings as jest.Mock).mockResolvedValue(response)

    const req = new NextRequest('http://localhost:3000/api/repositories/repo-1/embeddings', {
      method: 'POST',
      body: JSON.stringify({ branch: 'main' }),
    })
    const res = await POST(req, { params: Promise.resolve({ id: 'repo-1' }) })
    const data = await res.json()

    expect(res.status).toBe(202)
    expect(data).toEqual(response)
    expect(search.backendGenerateEmbeddings).toHaveBeenCalledWith('valid-token', 'repo-1', {
      branch: 'main',
      commit_sha: undefined,
    })
  })

  it('propagates in-progress response', async () => {
    const err = new Error('already queued')
    ;(err as any).statusCode = 409
    ;(err as any).errorResponse = { error: 'embeddings_in_progress' }

    ;(cookies.getAccessTokenCookie as jest.Mock).mockResolvedValue('valid-token')
    ;(search.backendGenerateEmbeddings as jest.Mock).mockRejectedValue(err)

    const req = new NextRequest('http://localhost:3000/api/repositories/repo-1/embeddings', {
      method: 'POST',
      body: JSON.stringify({ branch: 'main' }),
    })
    const res = await POST(req, { params: Promise.resolve({ id: 'repo-1' }) })
    const data = await res.json()

    expect(res.status).toBe(409)
    expect(data.error).toBe('embeddings_in_progress')
  })
})
