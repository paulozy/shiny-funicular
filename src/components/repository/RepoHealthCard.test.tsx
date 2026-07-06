import { render, screen } from '@testing-library/react'
import { RepoHealthCard } from './RepoHealthCard'
import { RepositoryResponse } from '@/lib/types/repository'

function makeRepo(overrides: Partial<RepositoryResponse> = {}): RepositoryResponse {
  return {
    id: 'r1',
    name: 'repo',
    full_name: 'org/repo',
    url: 'https://example.com',
    provider: 'github',
    is_private: false,
    sync_status: 'synced',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    organization_id: 'org-1',
    ...overrides,
  }
}

describe('RepoHealthCard', () => {
  it('shows the sync and embeddings pills', () => {
    render(<RepoHealthCard repo={makeRepo()} />)
    expect(screen.getByLabelText('Sync: em dia')).toBeInTheDocument()
    expect(screen.getByLabelText('Embeddings: sem provedor')).toBeInTheDocument()
    // analysis and coverage pills were removed from the MVP
    expect(screen.queryByLabelText(/Análise:/)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/Cobertura:/)).not.toBeInTheDocument()
  })

  it('marks sync error as danger', () => {
    render(<RepoHealthCard repo={makeRepo({ sync_status: 'error' })} />)
    expect(screen.getByLabelText('Sync: falhou')).toBeInTheDocument()
  })

  it('reports the embeddings status from a configured provider', () => {
    render(
      <RepoHealthCard
        repo={makeRepo()}
        embeddingsState={{ status: 'indexed', count: 42, provider_configured: true }}
      />
    )
    expect(screen.getByLabelText('Embeddings: indexado')).toBeInTheDocument()
  })
})
