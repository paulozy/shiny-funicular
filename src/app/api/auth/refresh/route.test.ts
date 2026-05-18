/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'

const setAuthCookiesMock = jest.fn()
const clearAuthCookiesMock = jest.fn()
const getRefreshTokenCookieMock = jest.fn()
const backendRefreshMock = jest.fn()

jest.mock('@/lib/cookies', () => ({
  setAuthCookies: (...args: unknown[]) => setAuthCookiesMock(...args),
  clearAuthCookies: () => clearAuthCookiesMock(),
  getRefreshTokenCookie: () => getRefreshTokenCookieMock(),
}))

jest.mock('@/lib/api/auth', () => ({
  backendRefresh: (...args: unknown[]) => backendRefreshMock(...args),
}))

import { POST } from './route'

function fakeRequest(): NextRequest {
  return new NextRequest(new Request('http://localhost:3001/api/auth/refresh', { method: 'POST' }))
}

describe('POST /api/auth/refresh', () => {
  beforeEach(() => {
    setAuthCookiesMock.mockReset()
    clearAuthCookiesMock.mockReset()
    getRefreshTokenCookieMock.mockReset()
    backendRefreshMock.mockReset()
  })

  it('returns 401 with no_refresh_token when the cookie is missing', async () => {
    getRefreshTokenCookieMock.mockResolvedValue(undefined)

    const res = await POST(fakeRequest())

    expect(res.status).toBe(401)
    expect(setAuthCookiesMock).not.toHaveBeenCalled()
    expect(clearAuthCookiesMock).not.toHaveBeenCalled()
  })

  it('sets new auth cookies and returns 200 when the backend returns a fresh pair', async () => {
    getRefreshTokenCookieMock.mockResolvedValue('refresh-1')
    backendRefreshMock.mockResolvedValue({
      access_token: 'a',
      refresh_token: 'r',
      expires_in: 900,
      refresh_expires_in: 604800,
    })

    const res = await POST(fakeRequest())

    expect(res.status).toBe(200)
    expect(setAuthCookiesMock).toHaveBeenCalledTimes(1)
    expect(clearAuthCookiesMock).not.toHaveBeenCalled()
  })

  it('clears cookies and returns 401 when the backend says the refresh is invalid', async () => {
    getRefreshTokenCookieMock.mockResolvedValue('refresh-burned')
    const err = Object.assign(new Error('invalid grant'), {
      statusCode: 401,
      errorResponse: { error: 'invalid_grant' },
    })
    backendRefreshMock.mockRejectedValue(err)

    const res = await POST(fakeRequest())

    expect(res.status).toBe(401)
    expect(clearAuthCookiesMock).toHaveBeenCalledTimes(1)
    expect(setAuthCookiesMock).not.toHaveBeenCalled()
  })

  it('PRESERVES cookies and returns 502 when the backend has a transient 500', async () => {
    getRefreshTokenCookieMock.mockResolvedValue('refresh-1')
    const err = Object.assign(new Error('boom'), {
      statusCode: 500,
      errorResponse: { error: 'internal_error' },
    })
    backendRefreshMock.mockRejectedValue(err)

    const res = await POST(fakeRequest())

    expect(res.status).toBe(502)
    expect(clearAuthCookiesMock).not.toHaveBeenCalled()
    expect(setAuthCookiesMock).not.toHaveBeenCalled()
  })

  it('PRESERVES cookies and returns 502 on a network error (no statusCode on the thrown error)', async () => {
    getRefreshTokenCookieMock.mockResolvedValue('refresh-1')
    backendRefreshMock.mockRejectedValue(new TypeError('network down'))

    const res = await POST(fakeRequest())

    expect(res.status).toBe(502)
    expect(clearAuthCookiesMock).not.toHaveBeenCalled()
  })
})
