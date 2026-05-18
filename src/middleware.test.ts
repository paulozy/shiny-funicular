/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'

import middleware from './middleware'

function makeRequest(
  path: string,
  cookies: Record<string, string> = {}
): NextRequest {
  const url = `http://localhost:3001${path}`
  const headers = new Headers()
  const cookieHeader = Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ')
  if (cookieHeader) headers.set('cookie', cookieHeader)
  return new NextRequest(new Request(url, { headers }))
}

describe('middleware (transparent refresh)', () => {
  let fetchMock: jest.Mock

  beforeEach(() => {
    fetchMock = jest.fn()
    ;(global as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch
  })

  it('lets public routes pass without checking cookies', async () => {
    const res = await middleware(makeRequest('/login'))
    expect(res.headers.get('location')).toBeNull()
    expect(res.status).toBe(200)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('lets protected routes pass when access_token is present', async () => {
    const res = await middleware(makeRequest('/', { access_token: 'still-valid' }))
    expect(res.status).toBe(200)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('redirects to /login when both cookies are missing', async () => {
    const res = await middleware(makeRequest('/'))
    expect(res.headers.get('location')).toContain('/login')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('refreshes transparently when only refresh_token is present and the backend returns 200', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          access_token: 'new-access',
          refresh_token: 'new-refresh',
          expires_in: 900,
          refresh_expires_in: 604800,
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    )

    const res = await middleware(makeRequest('/templates', { refresh_token: 'old-refresh' }))

    expect(res.status).toBe(200)
    expect(res.headers.get('location')).toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/auth\/refresh$/),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ refresh_token: 'old-refresh' }),
      })
    )

    // Set-Cookie should carry the new tokens with the right max-age.
    const setCookies = res.cookies.getAll().reduce<Record<string, { value: string; maxAge?: number }>>(
      (acc, c) => ({ ...acc, [c.name]: { value: c.value, maxAge: c.maxAge } }),
      {}
    )
    expect(setCookies.access_token?.value).toBe('new-access')
    expect(setCookies.access_token?.maxAge).toBe(900)
    expect(setCookies.refresh_token?.value).toBe('new-refresh')
    expect(setCookies.refresh_token?.maxAge).toBe(604800)
  })

  it('redirects to /login and clears both cookies when the backend says the refresh token is invalid (401)', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 401 }))

    const res = await middleware(makeRequest('/templates', { refresh_token: 'revoked' }))

    expect(res.headers.get('location')).toContain('/login')
    // When clearing, Next.js sets the cookie with maxAge 0 (or no value).
    const setCookies = res.cookies.getAll()
    const cleared = setCookies.filter(
      (c) => c.name === 'access_token' || c.name === 'refresh_token'
    )
    expect(cleared.length).toBe(2)
    for (const c of cleared) {
      expect(c.maxAge).toBe(0)
    }
  })

  it('redirects to /login WITHOUT clearing cookies when the backend has a transient 5xx', async () => {
    fetchMock.mockResolvedValue(new Response('boom', { status: 503 }))

    const res = await middleware(makeRequest('/templates', { refresh_token: 'still-valid' }))

    expect(res.headers.get('location')).toContain('/login')
    // No explicit cookie deletion happened — the response carries no
    // Set-Cookie headers for the auth cookies.
    const setCookies = res.cookies.getAll()
    const cleared = setCookies.filter(
      (c) => c.name === 'access_token' || c.name === 'refresh_token'
    )
    expect(cleared.length).toBe(0)
  })

  it('redirects to /login WITHOUT clearing cookies when the backend fetch throws (network error)', async () => {
    fetchMock.mockRejectedValue(new TypeError('network error'))

    const res = await middleware(makeRequest('/templates', { refresh_token: 'still-valid' }))

    expect(res.headers.get('location')).toContain('/login')
    const setCookies = res.cookies.getAll()
    expect(
      setCookies.filter((c) => c.name === 'access_token' || c.name === 'refresh_token').length
    ).toBe(0)
  })
})
