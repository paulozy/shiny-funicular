/**
 * The BFF boundary for the runner. What matters here is that the access token
 * never leaves the server and that an unauthenticated call is refused before
 * the backend is touched at all.
 */
import { GET } from './route'

jest.mock('@/lib/cookies', () => ({
  getAccessTokenCookie: jest.fn(),
}))

jest.mock('@/lib/api/onboarding', () => ({
  backendGetMyOnboarding: jest.fn(),
}))

const { getAccessTokenCookie } = jest.requireMock('@/lib/cookies')
const { backendGetMyOnboarding } = jest.requireMock('@/lib/api/onboarding')

describe('GET /api/onboarding/me', () => {
  beforeEach(() => jest.clearAllMocks())

  it('refuses an unauthenticated call without reaching the backend', async () => {
    getAccessTokenCookie.mockResolvedValue(undefined)

    const response = await GET()

    expect(response.status).toBe(401)
    expect(backendGetMyOnboarding).not.toHaveBeenCalled()
  })

  it('passes the cookie token through and returns the runs', async () => {
    getAccessTokenCookie.mockResolvedValue('token-abc')
    backendGetMyOnboarding.mockResolvedValue({
      items: [{ assignment_id: 'a1', flow_name: 'Geral', steps: [] }],
      total: 1,
    })

    const response = await GET()
    const body = await response.json()

    expect(backendGetMyOnboarding).toHaveBeenCalledWith('token-abc')
    expect(response.status).toBe(200)
    expect(body.items).toHaveLength(1)
  })

  it('translates a backend failure instead of leaking it', async () => {
    getAccessTokenCookie.mockResolvedValue('token-abc')
    const failure = Object.assign(new Error('boom'), { statusCode: 503 })
    backendGetMyOnboarding.mockRejectedValue(failure)

    const response = await GET()

    expect(response.status).toBe(503)
  })
})
