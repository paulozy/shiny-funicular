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
  it('shows the sync and coverage pills', () => {
    render(<RepoHealthCard repo={makeRepo()} />)
    expect(screen.getByLabelText('Sync: em dia')).toBeInTheDocument()
    expect(screen.getByLabelText('Coverage: não configurado')).toBeInTheDocument()
  })

  it('marks sync error as danger', () => {
    render(<RepoHealthCard repo={makeRepo({ sync_status: 'error' })} />)
    expect(screen.getByLabelText('Sync: falhou')).toBeInTheDocument()
  })

  it('reports the uploaded coverage percentage', () => {
    render(
      <RepoHealthCard
        repo={makeRepo({ stats: { has_coverage: true, test_coverage: 82.5, coverage_status: 'ok' } })}
      />
    )
    expect(screen.getByLabelText('Coverage: 82.5%')).toBeInTheDocument()
  })

  // A repo whose CI never uploaded must not be shown as a red 0% — that would
  // read as "no tests" when the truth is "we don't know".
  it('does not render a missing report as 0%', () => {
    render(<RepoHealthCard repo={makeRepo({ stats: { has_coverage: false, test_coverage: 0 } })} />)
    expect(screen.getByLabelText('Coverage: não configurado')).toBeInTheDocument()
    expect(screen.queryByLabelText('Coverage: 0.0%')).not.toBeInTheDocument()
  })
})
