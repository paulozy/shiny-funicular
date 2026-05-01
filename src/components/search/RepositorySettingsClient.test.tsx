import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { RepositorySettingsClient } from '@/app/(app)/code/repositories/[id]/settings/RepositorySettingsClient'
import { apiFetch } from '@/lib/api/client'
import { RepositoryResponse } from '@/lib/types/repository'
import { OrganizationConfigResponse } from '@/lib/types/organization'

jest.mock('@/lib/api/client', () => ({
  apiFetch: jest.fn(),
}))

const repo: RepositoryResponse = {
  id: 'repo-1',
  name: 'web',
  full_name: 'org/web',
  url: 'https://github.com/org/web',
  provider: 'github',
  is_private: false,
  metadata: { default_branch: 'main' },
  organization_id: 'org-1',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

const orgConfig: OrganizationConfigResponse = {
  anthropic_api_key_configured: true,
  anthropic_tokens_per_hour: 20000,
  github_token_configured: true,
  github_pr_review_enabled: true,
  webhook_base_url: '',
  embeddings_provider: 'voyage',
  voyage_api_key_configured: true,
  embeddings_model: 'voyage-code-3',
  embeddings_dimensions: 1024,
  github_client_id_configured: false,
  github_client_secret_configured: false,
  github_callback_url: '',
  gitlab_client_id_configured: false,
  gitlab_client_secret_configured: false,
  gitlab_callback_url: '',
  output_language: 'en',
}

describe('RepositorySettingsClient', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('queues embeddings generation for the selected branch', async () => {
    ;(apiFetch as jest.Mock).mockResolvedValue({ status: 'queued' })

    render(<RepositorySettingsClient repo={repo} orgConfig={orgConfig} canConfigureOrganization={true} />)

    fireEvent.click(screen.getByRole('button', { name: /gerar índice semântico/i }))

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith('/api/repositories/repo-1/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branch: 'main' }),
      })
    })
    expect(await screen.findByText(/indexação na fila/i)).toBeInTheDocument()
  })

  it('shows unavailable provider guidance', async () => {
    ;(apiFetch as jest.Mock).mockRejectedValue({ code: 'embeddings_unavailable' })

    render(<RepositorySettingsClient repo={repo} orgConfig={{ ...orgConfig, voyage_api_key_configured: false }} canConfigureOrganization={true} />)

    fireEvent.click(screen.getByRole('button', { name: /gerar índice semântico/i }))

    expect(await screen.findByText(/provider de embeddings não configurado/i)).toBeInTheDocument()
  })
})
