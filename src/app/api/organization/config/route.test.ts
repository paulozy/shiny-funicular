import { GET, PATCH } from './route'
import { NextRequest } from 'next/server'
import * as cookies from '@/lib/cookies'
import * as organization from '@/lib/api/organization'

jest.mock('@/lib/cookies')
jest.mock('@/lib/api/organization')

describe('/api/organization/config', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 401 when there is no access token', async () => {
    ;(cookies.getAccessTokenCookie as jest.Mock).mockResolvedValue(null)

    const req = new NextRequest('http://localhost:3001/api/organization/config')
    const res = await GET(req)
    const data = await res.json()

    expect(res.status).toBe(401)
    expect(data.error).toBe('unauthorized')
  })

  it('returns organization config for an authenticated admin', async () => {
    const config = {
      anthropic_api_key_configured: true,
      anthropic_tokens_per_hour: 20000,
      github_token_configured: true,
      github_pr_review_enabled: false,
      embeddings_provider: 'voyage',
      voyage_api_key_configured: true,
      embeddings_model: 'voyage-code-3',
      embeddings_dimensions: 1024,
      github_client_id_configured: false,
      github_client_secret_configured: false,
      gitlab_client_id_configured: false,
      gitlab_client_secret_configured: false,
      output_language: 'en',
    }

    ;(cookies.getAccessTokenCookie as jest.Mock).mockResolvedValue('token')
    ;(organization.backendGetOrganizationConfig as jest.Mock).mockResolvedValue(config)

    const req = new NextRequest('http://localhost:3001/api/organization/config')
    const res = await GET(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data).toEqual(config)
    expect(organization.backendGetOrganizationConfig).toHaveBeenCalledWith('token')
  })

  it('forwards patch payload to the backend helper', async () => {
    const payload = {
      github_pr_review_enabled: true,
      anthropic_api_key: 'new-key',
    }
    const response = {
      anthropic_api_key_configured: true,
      anthropic_tokens_per_hour: 20000,
      github_token_configured: false,
      github_pr_review_enabled: true,
      embeddings_provider: 'voyage',
      voyage_api_key_configured: false,
      embeddings_model: 'voyage-code-3',
      embeddings_dimensions: 1024,
      github_client_id_configured: false,
      github_client_secret_configured: false,
      gitlab_client_id_configured: false,
      gitlab_client_secret_configured: false,
      output_language: 'en',
    }

    ;(cookies.getAccessTokenCookie as jest.Mock).mockResolvedValue('token')
    ;(organization.backendUpdateOrganizationConfig as jest.Mock).mockResolvedValue(response)

    const req = new NextRequest('http://localhost:3001/api/organization/config', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
    const res = await PATCH(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data).toEqual(response)
    expect(organization.backendUpdateOrganizationConfig).toHaveBeenCalledWith('token', payload)
  })

  it('forwards output_language patch to the backend', async () => {
    const payload = { output_language: 'pt-BR' }
    const response = {
      anthropic_api_key_configured: true,
      anthropic_tokens_per_hour: 20000,
      github_token_configured: false,
      github_pr_review_enabled: false,
      embeddings_provider: 'voyage',
      voyage_api_key_configured: false,
      embeddings_model: 'voyage-code-3',
      embeddings_dimensions: 1024,
      github_client_id_configured: false,
      github_client_secret_configured: false,
      gitlab_client_id_configured: false,
      gitlab_client_secret_configured: false,
      output_language: 'pt-BR',
    }

    ;(cookies.getAccessTokenCookie as jest.Mock).mockResolvedValue('token')
    ;(organization.backendUpdateOrganizationConfig as jest.Mock).mockResolvedValue(response)

    const req = new NextRequest('http://localhost:3001/api/organization/config', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
    const res = await PATCH(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data).toEqual(response)
    expect(organization.backendUpdateOrganizationConfig).toHaveBeenCalledWith('token', payload)
  })

  it('normalizes forbidden backend errors', async () => {
    const err = new Error('admin role is required')
    ;(err as any).statusCode = 403

    ;(cookies.getAccessTokenCookie as jest.Mock).mockResolvedValue('token')
    ;(organization.backendGetOrganizationConfig as jest.Mock).mockRejectedValue(err)

    const req = new NextRequest('http://localhost:3001/api/organization/config')
    const res = await GET(req)
    const data = await res.json()

    expect(res.status).toBe(403)
    expect(data).toEqual({ error: 'forbidden', message: 'Acesso não autorizado' })
  })
})
