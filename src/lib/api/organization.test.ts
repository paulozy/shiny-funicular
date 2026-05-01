import { backendUpdateOrganizationConfig } from './organization'

describe('organization api', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  it('updates organization config with PATCH', async () => {
    const response = {
      anthropic_api_key_configured: true,
      anthropic_tokens_per_hour: 30000,
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

    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => response,
    } as Response)

    const result = await backendUpdateOrganizationConfig('token', {
      anthropic_tokens_per_hour: 30000,
      github_pr_review_enabled: true,
    })

    expect(result).toEqual(response)
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3000/api/v1/organizations/configs', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer token',
      },
      body: JSON.stringify({
        anthropic_tokens_per_hour: 30000,
        github_pr_review_enabled: true,
      }),
    })
  })
})
