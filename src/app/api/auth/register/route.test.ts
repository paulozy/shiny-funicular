/**
 * Registration has two shapes, and the BFF used to admit only one: it required
 * `organization_name` unconditionally, which made accepting an invite through
 * the UI impossible even though the backend supports it. These tests pin both
 * paths.
 */
import { POST } from './route'

jest.mock('@/lib/api/auth', () => ({
  backendRegister: jest.fn(),
}))

jest.mock('@/lib/cookies', () => ({
  setAuthCookies: jest.fn(),
}))

const { backendRegister } = jest.requireMock('@/lib/api/auth')
const { setAuthCookies } = jest.requireMock('@/lib/cookies')

type RouteRequest = Parameters<typeof POST>[0]

function registerRequest(body: unknown): RouteRequest {
  return new Request('http://localhost/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
  }) as unknown as RouteRequest
}

const backendResponse = {
  access_token: 'a',
  refresh_token: 'r',
  user: { id: 'u1', email: 'novo@example.test' },
  organization: { id: 'o1', name: 'Org' },
}

describe('POST /api/auth/register', () => {
  beforeEach(() => jest.clearAllMocks())

  it('creates an organization when given a name', async () => {
    backendRegister.mockResolvedValue(backendResponse)

    const response = await POST(
      registerRequest({
        email: 'novo@example.test',
        full_name: 'Novo',
        password: 'E2ePassw0rd!',
        organization_name: 'Minha Empresa',
      })
    )

    expect(response.status).toBe(201)
    expect(setAuthCookies).toHaveBeenCalled()
  })

  it('joins an organization with an invite and no organization name', async () => {
    backendRegister.mockResolvedValue(backendResponse)

    const response = await POST(
      registerRequest({
        email: 'convidado@example.test',
        full_name: 'Convidado',
        password: 'E2ePassw0rd!',
        invite_token: 'inv_abc',
      })
    )

    // The whole point: an invite is the other way in, and demanding an
    // organization name here locked every invited person out of the product.
    expect(response.status).toBe(201)
    expect(backendRegister).toHaveBeenCalledWith(
      expect.objectContaining({ invite_token: 'inv_abc' })
    )
  })

  it('refuses a registration that neither names an organization nor carries an invite', async () => {
    const response = await POST(
      registerRequest({
        email: 'ninguem@example.test',
        full_name: 'Ninguém',
        password: 'E2ePassw0rd!',
      })
    )

    expect(response.status).toBe(400)
    expect(backendRegister).not.toHaveBeenCalled()
  })

  it('still requires the basics', async () => {
    const response = await POST(registerRequest({ email: 'x@example.test' }))

    expect(response.status).toBe(400)
    expect(backendRegister).not.toHaveBeenCalled()
  })

  it('rejects a short password before calling the backend', async () => {
    const response = await POST(
      registerRequest({
        email: 'novo@example.test',
        full_name: 'Novo',
        password: 'curta',
        invite_token: 'inv_abc',
      })
    )

    expect(response.status).toBe(400)
    expect(backendRegister).not.toHaveBeenCalled()
  })
})
