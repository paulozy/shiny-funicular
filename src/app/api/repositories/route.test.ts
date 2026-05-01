import { GET, POST } from './route'
import { NextRequest } from 'next/server'
import * as cookies from '@/lib/cookies'
import * as repositories from '@/lib/api/repositories'

jest.mock('@/lib/cookies')
jest.mock('@/lib/api/repositories')

describe('/api/repositories', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('returns 401 if no access token', async () => {
      ;(cookies.getAccessTokenCookie as jest.Mock).mockResolvedValue(null)

      const req = new NextRequest('http://localhost:3000/api/repositories')
      const res = await GET(req)
      const data = await res.json()

      expect(res.status).toBe(401)
      expect(data.error).toBe('unauthorized')
    })

    it('returns repositories when token is valid', async () => {
      const mockRepos = {
        repositories: [
          {
            id: '1',
            name: 'test-repo',
            full_name: 'org/test-repo',
            url: 'https://github.com/org/test-repo',
            provider: 'github' as const,
            is_private: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            organization_id: 'org1',
          },
        ],
        total: 1,
        limit: 20,
        offset: 0,
      }

      ;(cookies.getAccessTokenCookie as jest.Mock).mockResolvedValue('valid-token')
      ;(repositories.backendGetRepositories as jest.Mock).mockResolvedValue(mockRepos)

      const req = new NextRequest('http://localhost:3000/api/repositories?limit=20&offset=0')
      const res = await GET(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data).toEqual(mockRepos)
    })

    it('passes limit and offset parameters', async () => {
      ;(cookies.getAccessTokenCookie as jest.Mock).mockResolvedValue('valid-token')
      ;(repositories.backendGetRepositories as jest.Mock).mockResolvedValue({ repositories: [], total: 0, limit: 10, offset: 5 })

      const req = new NextRequest('http://localhost:3000/api/repositories?limit=10&offset=5')
      await GET(req)

      expect(repositories.backendGetRepositories).toHaveBeenCalledWith('valid-token', { limit: 10, offset: 5 })
    })
  })

  describe('POST', () => {
    it('returns 401 if no access token', async () => {
      ;(cookies.getAccessTokenCookie as jest.Mock).mockResolvedValue(null)

      const req = new NextRequest('http://localhost:3000/api/repositories', {
        method: 'POST',
        body: JSON.stringify({ url: 'https://github.com/org/repo' }),
      })
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(401)
      expect(data.error).toBe('unauthorized')
    })

    it('returns 400 if URL is missing', async () => {
      ;(cookies.getAccessTokenCookie as jest.Mock).mockResolvedValue('valid-token')

      const req = new NextRequest('http://localhost:3000/api/repositories', {
        method: 'POST',
        body: JSON.stringify({ description: 'test' }),
      })
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.error).toBe('invalid_request')
    })

    it('creates repository successfully', async () => {
      const mockNewRepo = {
        id: '1',
        name: 'test-repo',
        full_name: 'org/test-repo',
        url: 'https://github.com/org/test-repo',
        provider: 'github' as const,
        is_private: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        organization_id: 'org1',
      }

      ;(cookies.getAccessTokenCookie as jest.Mock).mockResolvedValue('valid-token')
      ;(repositories.backendCreateRepository as jest.Mock).mockResolvedValue(mockNewRepo)

      const req = new NextRequest('http://localhost:3000/api/repositories', {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://github.com/org/test-repo',
          description: 'test',
          is_private: false,
        }),
      })
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(201)
      expect(data).toEqual(mockNewRepo)
      expect(repositories.backendCreateRepository).toHaveBeenCalledWith('valid-token', {
        url: 'https://github.com/org/test-repo',
        description: 'test',
        is_private: false,
        is_public: true,
      })
    })
  })
})
