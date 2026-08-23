import { render, screen } from '@testing-library/react'
import { RepositoryOverviewClient } from '@/app/(app)/code/repositories/[id]/RepositoryOverviewClient'
import { RepositoryResponse } from '@/lib/types/repository'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

const repo: RepositoryResponse = {
  id: 'repo-1',
  name: 'web',
  full_name: 'org/web',
  description: 'Frontend principal',
  url: 'https://github.com/org/web',
  provider: 'github',
  is_private: false,
  stats: {
    has_coverage: true,
    test_coverage: 76,
    coverage_status: 'ok' as const,
  },
  metadata: {
    default_branch: 'develop',
    pr_count: 3,
    issue_count: 2,
    test_coverage: 76,
    contributors: 5,
    languages: { TypeScript: 70, CSS: 30 },
    frameworks: ['Next.js'],
    topics: ['frontend'],
    has_ci: true,
    has_tests: true,
  },
  organization_id: 'org-1',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-02T00:00:00Z',
}

// The repository identity (name, description, branch, actions) moved to
// `RepositoryHeader`, rendered once by the repository layout — the overview is
// only the tiles and the cards below them.
describe('RepositoryOverviewClient', () => {
  it('renders the activity tiles from the sync metadata', () => {
    render(<RepositoryOverviewClient repo={repo} />)

    expect(screen.getByText('PRs abertos')).toBeInTheDocument()
    expect(screen.getByText('Issues')).toBeInTheDocument()
    expect(screen.getByText('Contribuidores')).toBeInTheDocument()
    expect(screen.getByText('Conformidade')).toBeInTheDocument()

    // The PR tile is the only one that leads somewhere.
    expect(screen.getByRole('link', { name: /ver prs abertos/i })).toHaveAttribute(
      'href',
      '/code/repositories/repo-1/pull-requests'
    )
  })

  it('keeps coverage and drops the AI-derived artifacts', () => {
    render(<RepositoryOverviewClient repo={repo} />)

    // coverage survives — it comes from the CI upload, not from an analysis
    expect(screen.getByLabelText('Coverage: 76.0%')).toBeInTheDocument()
    expect(screen.queryByText('85/100')).not.toBeInTheDocument()
    expect(screen.queryByText(/concluída/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /buscar no repositório/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /gerar template/i })).not.toBeInTheDocument()
  })

  it('renders stack and metadata fallbacks safely', () => {
    render(<RepositoryOverviewClient repo={{ ...repo, stats: undefined, metadata: {} }} />)

    // Stack card collapses to a single empty-state line when languages,
    // frameworks and topics are all absent.
    expect(screen.getByText(/Sem informações de stack detectadas/i)).toBeInTheDocument()
    // Missing counters render as an em dash, never as a fabricated zero.
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
    expect(screen.queryByText(/sem análise/i)).not.toBeInTheDocument()
  })
})
