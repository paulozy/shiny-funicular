/**
 * The mark endpoint. The BFF rejects a status the domain does not store, so a
 * typo in the client cannot reach the database as an unknown state.
 */
import { POST } from './route'

jest.mock('@/lib/cookies', () => ({
  getAccessTokenCookie: jest.fn(),
}))

jest.mock('@/lib/api/onboarding', () => ({
  backendMarkOnboardingStep: jest.fn(),
}))

const { getAccessTokenCookie } = jest.requireMock('@/lib/cookies')
const { backendMarkOnboardingStep } = jest.requireMock('@/lib/api/onboarding')

// The route's typed parameters come from Next; the casts are confined to these
// two helpers so the tests themselves stay readable.
type RouteRequest = Parameters<typeof POST>[0]
type RouteContext = Parameters<typeof POST>[1]

function markRequest(body: unknown): RouteRequest {
  return new Request('http://localhost/api/onboarding/me/steps/step-1', {
    method: 'POST',
    body: JSON.stringify(body),
  }) as unknown as RouteRequest
}

function markContext(): RouteContext {
  return { params: Promise.resolve({ stepID: 'step-1' }) } as RouteContext
}

describe('POST /api/onboarding/me/steps/[stepID]', () => {
  beforeEach(() => jest.clearAllMocks())

  it('accepts done and forwards the note', async () => {
    getAccessTokenCookie.mockResolvedValue('token-abc')
    backendMarkOnboardingStep.mockResolvedValue({ assignment_id: 'a1', steps: [] })

    const response = await POST(markRequest({ status: 'done', note: 'lido' }), markContext())

    expect(response.status).toBe(200)
    expect(backendMarkOnboardingStep).toHaveBeenCalledWith('token-abc', 'step-1', {
      status: 'done',
      note: 'lido',
    })
  })

  it('accepts skipped', async () => {
    getAccessTokenCookie.mockResolvedValue('token-abc')
    backendMarkOnboardingStep.mockResolvedValue({ assignment_id: 'a1', steps: [] })

    const response = await POST(markRequest({ status: 'skipped' }), markContext())

    expect(response.status).toBe(200)
  })

  it('rejects a status the domain does not store', async () => {
    getAccessTokenCookie.mockResolvedValue('token-abc')

    // `pending` is the absence of a row, never a value to write.
    const response = await POST(markRequest({ status: 'pending' }), markContext())

    expect(response.status).toBe(400)
    expect(backendMarkOnboardingStep).not.toHaveBeenCalled()
  })
})
