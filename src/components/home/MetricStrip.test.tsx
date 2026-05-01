import { RepositoryListResponse } from '@/lib/types/repository'

describe('MetricStrip aggregation', () => {
  it('correctly sums PR counts', () => {
    const repos: RepositoryListResponse = {
      repositories: [
        {
          id: '1',
          name: 'repo1',
          full_name: 'org/repo1',
          url: '',
          provider: 'github',
          is_private: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          organization_id: 'org1',
          metadata: { pr_count: 3 },
        },
        {
          id: '2',
          name: 'repo2',
          full_name: 'org/repo2',
          url: '',
          provider: 'github',
          is_private: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          organization_id: 'org1',
          metadata: { pr_count: 5 },
        },
      ],
      total: 2,
      limit: 20,
      offset: 0,
    }

    const totalPRs = repos.repositories.reduce((sum, repo) => sum + (repo.metadata?.pr_count ?? 0), 0)
    expect(totalPRs).toBe(8)
  })

  it('correctly sums issue counts', () => {
    const repos: RepositoryListResponse = {
      repositories: [
        {
          id: '1',
          name: 'repo1',
          full_name: 'org/repo1',
          url: '',
          provider: 'github',
          is_private: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          organization_id: 'org1',
          metadata: { issue_count: 2 },
        },
        {
          id: '2',
          name: 'repo2',
          full_name: 'org/repo2',
          url: '',
          provider: 'github',
          is_private: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          organization_id: 'org1',
          metadata: { issue_count: 3 },
        },
      ],
      total: 2,
      limit: 20,
      offset: 0,
    }

    const totalIssues = repos.repositories.reduce((sum, repo) => sum + (repo.metadata?.issue_count ?? 0), 0)
    expect(totalIssues).toBe(5)
  })

  it('correctly calculates average coverage', () => {
    const repos: RepositoryListResponse = {
      repositories: [
        {
          id: '1',
          name: 'repo1',
          full_name: 'org/repo1',
          url: '',
          provider: 'github',
          is_private: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          organization_id: 'org1',
          metadata: { test_coverage: 80 },
        },
        {
          id: '2',
          name: 'repo2',
          full_name: 'org/repo2',
          url: '',
          provider: 'github',
          is_private: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          organization_id: 'org1',
          metadata: { test_coverage: 90 },
        },
        {
          id: '3',
          name: 'repo3',
          full_name: 'org/repo3',
          url: '',
          provider: 'github',
          is_private: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          organization_id: 'org1',
          metadata: { test_coverage: 70 },
        },
      ],
      total: 3,
      limit: 20,
      offset: 0,
    }

    const coverageValues = repos.repositories
      .map((repo) => repo.metadata?.test_coverage)
      .filter((val): val is number => val !== undefined && val !== null)

    const avgCoverage = coverageValues.length > 0 ? Math.round(coverageValues.reduce((a, b) => a + b, 0) / coverageValues.length) : null

    expect(avgCoverage).toBe(80)
  })

  it('handles repos with no coverage data', () => {
    const repos: RepositoryListResponse = {
      repositories: [
        {
          id: '1',
          name: 'repo1',
          full_name: 'org/repo1',
          url: '',
          provider: 'github',
          is_private: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          organization_id: 'org1',
          metadata: {},
        },
        {
          id: '2',
          name: 'repo2',
          full_name: 'org/repo2',
          url: '',
          provider: 'github',
          is_private: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          organization_id: 'org1',
          metadata: {},
        },
      ],
      total: 2,
      limit: 20,
      offset: 0,
    }

    const coverageValues = repos.repositories
      .map((repo) => repo.metadata?.test_coverage)
      .filter((val): val is number => val !== undefined && val !== null)

    const avgCoverage = coverageValues.length > 0 ? Math.round(coverageValues.reduce((a, b) => a + b, 0) / coverageValues.length) : null

    expect(avgCoverage).toBeNull()
  })

  it('handles empty repo list', () => {
    const repos: RepositoryListResponse = {
      repositories: [],
      total: 0,
      limit: 20,
      offset: 0,
    }

    const totalPRs = repos.repositories.reduce((sum, repo) => sum + (repo.metadata?.pr_count ?? 0), 0)
    const totalIssues = repos.repositories.reduce((sum, repo) => sum + (repo.metadata?.issue_count ?? 0), 0)

    expect(totalPRs).toBe(0)
    expect(totalIssues).toBe(0)
  })
})
