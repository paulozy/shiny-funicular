function mockRes(status: number, body?: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body ?? {},
  } as unknown as Response
}

describe('apiFetch refresh-token concurrency', () => {
  let apiFetch: typeof import('./client').apiFetch
  let AuthError: typeof import('./client').AuthError
  let fetchMock: jest.Mock

  beforeEach(() => {
    jest.resetModules()
    fetchMock = jest.fn()
    ;(global as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch
    const mod = require('./client')
    apiFetch = mod.apiFetch
    AuthError = mod.AuthError
  })

  it('coalesces N concurrent 401s into a single /api/auth/refresh call', async () => {
    const protectedCalls = new Map<string, number>()
    fetchMock.mockImplementation(async (url: string) => {
      if (url === '/api/auth/refresh') {
        await new Promise((r) => setTimeout(r, 10))
        return mockRes(200)
      }
      if (url === '/api/auth/logout') return mockRes(200)
      const n = (protectedCalls.get(url) ?? 0) + 1
      protectedCalls.set(url, n)
      return n === 1 ? mockRes(401, { error: 'unauthorized' }) : mockRes(200, { url })
    })

    const results = await Promise.all([
      apiFetch<{ url: string }>('/a'),
      apiFetch<{ url: string }>('/b'),
      apiFetch<{ url: string }>('/c'),
    ])
    expect(results).toEqual([{ url: '/a' }, { url: '/b' }, { url: '/c' }])

    const refreshCalls = fetchMock.mock.calls.filter(
      (c: unknown[]) => c[0] === '/api/auth/refresh'
    ).length
    expect(refreshCalls).toBe(1)
  })

  it('clears the single-flight slot after a successful refresh so a later 401 triggers a new refresh', async () => {
    const protectedCalls = new Map<string, number>()
    fetchMock.mockImplementation(async (url: string) => {
      if (url === '/api/auth/refresh') {
        await new Promise((r) => setTimeout(r, 0))
        return mockRes(200)
      }
      if (url === '/api/auth/logout') return mockRes(200)
      const n = (protectedCalls.get(url) ?? 0) + 1
      protectedCalls.set(url, n)
      return n === 1 ? mockRes(401, { error: 'unauthorized' }) : mockRes(200, { url, n })
    })

    await apiFetch('/x')
    await apiFetch('/y')

    const refreshCalls = fetchMock.mock.calls.filter(
      (c: unknown[]) => c[0] === '/api/auth/refresh'
    ).length
    expect(refreshCalls).toBe(2)
  })

  it('logs out and throws AuthError when refresh fails, without retrying the original request', async () => {
    const calls: string[] = []
    fetchMock.mockImplementation(async (url: string) => {
      calls.push(url)
      if (url === '/api/auth/refresh') return mockRes(401, { error: 'invalid_grant' })
      if (url === '/api/auth/logout') return mockRes(200)
      return mockRes(401, { error: 'unauthorized' })
    })

    await expect(apiFetch('/protected')).rejects.toBeInstanceOf(AuthError)

    expect(calls.filter((c) => c === '/protected').length).toBe(1)
    expect(calls.filter((c) => c === '/api/auth/refresh').length).toBe(1)
    expect(calls.filter((c) => c === '/api/auth/logout').length).toBe(1)
  })

  it('does not loop forever when the refreshed retry still returns 401', async () => {
    const calls: string[] = []
    fetchMock.mockImplementation(async (url: string) => {
      calls.push(url)
      if (url === '/api/auth/refresh') return mockRes(200)
      if (url === '/api/auth/logout') return mockRes(200)
      return mockRes(401, { error: 'unauthorized' })
    })

    await expect(apiFetch('/protected')).rejects.toBeInstanceOf(AuthError)

    expect(calls.filter((c) => c === '/protected').length).toBe(2)
    expect(calls.filter((c) => c === '/api/auth/refresh').length).toBe(1)
    expect(calls.filter((c) => c === '/api/auth/logout').length).toBe(1)
  })

  it('clears the single-flight slot after a failed refresh so a later 401 retries the refresh', async () => {
    let refreshAttempts = 0
    fetchMock.mockImplementation(async (url: string) => {
      if (url === '/api/auth/refresh') {
        refreshAttempts++
        return mockRes(401, { error: 'invalid_grant' })
      }
      if (url === '/api/auth/logout') return mockRes(200)
      return mockRes(401, { error: 'unauthorized' })
    })

    await expect(apiFetch('/a')).rejects.toBeInstanceOf(AuthError)
    await expect(apiFetch('/b')).rejects.toBeInstanceOf(AuthError)

    expect(refreshAttempts).toBe(2)
  })
})
