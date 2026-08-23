import { logger } from '@/lib/logger'
import { backendFetch, getApiUrl } from './_shared'

describe('backendFetch', () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
    jest.restoreAllMocks()
  })

  it('passes the request through untouched and returns the response', async () => {
    const response = new Response('{}', { status: 200 })
    const fetchMock = jest.fn().mockResolvedValue(response)
    global.fetch = fetchMock as unknown as typeof fetch

    const url = getApiUrl('/repositories')
    const result = await backendFetch(url, { method: 'GET' })

    expect(result).toBe(response)
    expect(fetchMock).toHaveBeenCalledWith(url, { method: 'GET' })
  })

  // The whole point of the wrapper: one line per upstream call, with the path
  // and the duration, so a slow page can be attributed instead of guessed at.
  it('logs the path, status and duration of every call', async () => {
    const debug = jest.spyOn(logger, 'debug').mockImplementation(() => {})
    global.fetch = jest.fn().mockResolvedValue(new Response('{}', { status: 200 })) as unknown as typeof fetch

    await backendFetch(getApiUrl('/repositories/abc/pull-requests'))

    expect(debug).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        path: '/repositories/abc/pull-requests',
        status: 200,
        ms: expect.any(Number),
      }),
      'backend_request'
    )
  })

  it('raises a slow call to a warning so it survives the production log level', async () => {
    const warn = jest.spyOn(logger, 'warn').mockImplementation(() => {})
    global.fetch = jest.fn().mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(new Response('{}')), 850))
    ) as unknown as typeof fetch

    await backendFetch(getApiUrl('/slow'))

    expect(warn).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/slow' }),
      'backend_request_slow'
    )
  })

  it('logs and rethrows when the backend is unreachable', async () => {
    const error = jest.spyOn(logger, 'error').mockImplementation(() => {})
    global.fetch = jest.fn().mockRejectedValue(new Error('ECONNREFUSED')) as unknown as typeof fetch

    await expect(backendFetch(getApiUrl('/repositories'))).rejects.toThrow('ECONNREFUSED')
    expect(error).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/repositories' }),
      'backend_request_failed'
    )
  })
})
