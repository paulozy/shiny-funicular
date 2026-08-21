import { render, screen } from '@testing-library/react'
import { RepositoryOverviewClient } from '@/app/(app)/code/repositories/[id]/RepositoryOverviewClient'
import { RepositoryResponse } from '@/lib/types/repository'

jest.mock('@/lib/api/client', () => ({ apiFetch: jest.fn().mockResolvedValue({}) }))

function repo(metadata: RepositoryResponse['metadata']): RepositoryResponse {
  return {
    id: 'r1',
    name: 'web',
    full_name: 'org/web',
    url: 'https://github.com/org/web',
    provider: 'github',
    is_private: false,
    sync_status: 'synced',
    metadata,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    organization_id: 'org-1',
  }
}

describe('CI and test signals', () => {
  // The regression this guards: the field was never populated, so every
  // repository claimed "Não detectado" — a confident answer we had not earned.
  it('says "não verificado" when the signal is absent, not "não encontrado"', () => {
    render(<RepositoryOverviewClient repo={repo({})} />)

    expect(screen.getAllByText('Não verificado')).toHaveLength(2)
    expect(screen.queryByText('Não encontrados')).not.toBeInTheDocument()
    expect(screen.queryByText('Não encontrado')).not.toBeInTheDocument()
  })

  it('distinguishes a determined absence from an unknown one', () => {
    render(<RepositoryOverviewClient repo={repo({ has_ci: false, has_tests: false })} />)

    expect(screen.getByText('Não encontrado')).toBeInTheDocument()
    expect(screen.getByText('Não encontrados')).toBeInTheDocument()
    expect(screen.queryByText('Não verificado')).not.toBeInTheDocument()
  })

  it('reports a positive signal', () => {
    render(
      <RepositoryOverviewClient
        repo={repo({ has_ci: true, has_tests: true, ci_evidence: '.github/workflows/ci.yml' })}
      />
    )

    expect(screen.getByText('Configurado')).toBeInTheDocument()
    expect(screen.getByText('Detectados')).toBeInTheDocument()
  })
})
