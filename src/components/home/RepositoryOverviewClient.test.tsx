import { render, screen } from '@testing-library/react'
import { RepositoryOverviewClient } from '@/app/(app)/code/repositories/[id]/RepositoryOverviewClient'
import { RepositoryResponse } from '@/lib/types/repository'

const repo: RepositoryResponse = {
  id: 'repo-1',
  name: 'web',
  full_name: 'org/web',
  description: 'Frontend principal',
  url: 'https://github.com/org/web',
  provider: 'github',
  is_private: false,
  analysis_status: 'completed',
  reviews_count: 5,
  stats: {
    total_analyses: 10,
    latest_quality_score: 85,
    has_analysis: true,
    last_analyzed_at: '2026-04-30T14:23:15.123Z',
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

describe('RepositoryOverviewClient', () => {
  it('renders repository identity, metrics and action links', () => {
    render(<RepositoryOverviewClient repo={repo} />)

    expect(screen.getByRole('heading', { name: 'web' })).toBeInTheDocument()
    expect(screen.getByText(/Frontend principal/i)).toBeInTheDocument()
    expect(screen.getByText('develop')).toBeInTheDocument()
    expect(screen.getByText('85/100')).toBeInTheDocument()
    expect(screen.getAllByText('5').length).toBeGreaterThan(0)
    expect(screen.getAllByText('10').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/concluída/i).length).toBeGreaterThan(0)
    expect(screen.getByText('76%')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /buscar no repositório/i })).toHaveAttribute(
      'href',
      '/code/repositories/repo-1/search?branch=develop'
    )
    expect(screen.getAllByRole('link', { name: /configurações/i }).some((link) => link.getAttribute('href') === '/code/repositories/repo-1/settings')).toBe(true)
  })

  it('renders languages and metadata fallbacks safely', () => {
    render(<RepositoryOverviewClient repo={{ ...repo, analysis_status: null, reviews_count: null, stats: undefined, metadata: {} }} />)

    expect(screen.getByText(/Sem linguagens detectadas/i)).toBeInTheDocument()
    expect(screen.getByText(/Sem frameworks ou tópicos detectados/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Sem análise/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/Nunca analisado/i)).toBeInTheDocument()
    expect(screen.getByText('main')).toBeInTheDocument()
  })
})
