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
    analysis_status: 'completed',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    organization_id: 'org-1',
    ...overrides,
  }
}

describe('RepoHealthCard', () => {
  it('shows the four pill labels', () => {
    render(
      <RepoHealthCard
        repo={makeRepo()}
        coverage={{ percentage: 90, status: 'ok' }}
      />
    )
    expect(screen.getByLabelText('Sync: em dia')).toBeInTheDocument()
    expect(screen.getByLabelText('Análise: concluída')).toBeInTheDocument()
    expect(screen.getByLabelText('Embeddings: sem provedor')).toBeInTheDocument()
    expect(screen.getByLabelText('Cobertura: 90%')).toBeInTheDocument()
  })

  it('marks sync error as danger', () => {
    render(
      <RepoHealthCard
        repo={makeRepo({ sync_status: 'error' })}
        coverage={{ status: '', percentage: undefined }}
      />
    )
    expect(screen.getByLabelText('Sync: falhou')).toBeInTheDocument()
  })

  it('treats missing coverage as "sem dados"', () => {
    render(
      <RepoHealthCard
        repo={makeRepo()}
        coverage={{ status: '', percentage: undefined }}
      />
    )
    expect(screen.getByLabelText('Cobertura: sem dados')).toBeInTheDocument()
  })

  it('reports the embeddings status from a configured provider', () => {
    render(
      <RepoHealthCard
        repo={makeRepo()}
        embeddingsState={{ status: 'indexed', count: 42, provider_configured: true }}
        coverage={{ status: '', percentage: undefined }}
      />
    )
    expect(screen.getByLabelText('Embeddings: indexado')).toBeInTheDocument()
  })

  it('uses warn tone when analysis is pending', () => {
    render(
      <RepoHealthCard
        repo={makeRepo({ analysis_status: 'pending' })}
        coverage={{ status: '', percentage: undefined }}
      />
    )
    expect(screen.getByLabelText('Análise: pendente')).toBeInTheDocument()
  })
})
