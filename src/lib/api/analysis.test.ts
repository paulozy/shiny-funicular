import { backendListAnalyses } from './analysis'
import { BackendError } from './_shared'

const VALID_RESPONSE = {
  total: 1,
  analyses: [
    {
      id: 'analysis-1',
      repository_id: 'repo-1',
      type: 'code_review',
      status: 'completed',
      issues: [
        {
          severity: 'critical',
          category: 'security',
          title: 'hardcoded key',
          description: 'exposed key in source',
          is_ai_generated: true,
          confidence: 0.95,
        },
      ],
      issue_count: 1,
      critical_count: 1,
      error_count: 0,
      warning_count: 0,
      info_count: 0,
      tokens_used: 1234,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
  ],
  limit: 20,
  offset: 0,
}

function mockFetchOnce(response: { ok: boolean; status?: number; body: unknown }) {
  ;(global as { fetch?: typeof fetch }).fetch = jest.fn().mockResolvedValue({
    ok: response.ok,
    status: response.status ?? (response.ok ? 200 : 500),
    json: async () => response.body,
  } as Response)
}

describe('backendListAnalyses', () => {
  afterEach(() => {
    delete (global as { fetch?: typeof fetch }).fetch
    jest.restoreAllMocks()
  })

  it('returns the parsed list on a valid response', async () => {
    mockFetchOnce({ ok: true, body: VALID_RESPONSE })
    const result = await backendListAnalyses('token', 'repo-1')
    expect(result.total).toBe(1)
    expect(result.analyses).toHaveLength(1)
    expect(result.analyses[0].issues[0].severity).toBe('critical')
  })

  it('throws BackendError(502) when the response shape does not match', async () => {
    mockFetchOnce({
      ok: true,
      body: {
        // Wrong: `analyses` is required to be an array; backend regressed
        // to returning a single object. parseOrThrow must catch this.
        total: 1,
        analyses: { id: 'oops' },
        limit: 20,
        offset: 0,
      },
    })

    await expect(backendListAnalyses('token', 'repo-1')).rejects.toMatchObject({
      name: 'BackendError',
      statusCode: 502,
    })
  })

  it('throws BackendError with the upstream status when the backend errors', async () => {
    mockFetchOnce({
      ok: false,
      status: 503,
      body: { error: 'service_unavailable', message: 'backend down' },
    })

    await expect(backendListAnalyses('token', 'repo-1')).rejects.toMatchObject({
      name: 'BackendError',
      statusCode: 503,
    })
  })

  it('passes limit and offset through the query string', async () => {
    mockFetchOnce({ ok: true, body: VALID_RESPONSE })
    await backendListAnalyses('token', 'repo-1', { limit: 5, offset: 10 })
    const call = (global.fetch as jest.Mock).mock.calls[0][0] as string
    expect(call).toContain('limit=5')
    expect(call).toContain('offset=10')
  })
})

// Sanity check: the error class is exported and instanceof works across module
// boundaries. Catches the "thrown literal vs class" foot-gun.
describe('BackendError', () => {
  it('is an instance of Error and exposes statusCode', () => {
    const e = new BackendError('boom', 502)
    expect(e).toBeInstanceOf(Error)
    expect(e.name).toBe('BackendError')
    expect(e.statusCode).toBe(502)
  })
})
