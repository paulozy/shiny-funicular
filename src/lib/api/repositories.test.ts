import { normalizeRepositoryList } from './repositories'

describe('repository api normalization', () => {
  it('normalizes backend items/type/is_public into frontend repositories/provider/is_private', () => {
    const normalized = normalizeRepositoryList({
      items: [
        {
          id: 'repo-1',
          name: 'api',
          description: 'backend api',
          url: 'https://github.com/org/api',
          type: 'github',
          organization_id: 'org-1',
          is_public: false,
          metadata: { default_branch: 'main', pr_count: 2 },
          analysis_status: 'completed',
          reviews_count: 5,
          stats: {
            total_analyses: 10,
            latest_quality_score: 85,
            has_analysis: true,
            last_analyzed_at: '2026-04-30T14:23:15.123Z',
          },
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-02T00:00:00Z',
        },
      ],
      total: 1,
      limit: 20,
      offset: 0,
    })

    expect(normalized.repositories).toHaveLength(1)
    expect(normalized.repositories[0]).toMatchObject({
      id: 'repo-1',
      name: 'api',
      full_name: 'api',
      provider: 'github',
      is_private: true,
      organization_id: 'org-1',
      analysis_status: 'completed',
      reviews_count: 5,
      stats: {
        total_analyses: 10,
        latest_quality_score: 85,
        has_analysis: true,
        last_analyzed_at: '2026-04-30T14:23:15.123Z',
      },
    })
    expect(normalized.total).toBe(1)
  })

  it('keeps already-normalized repository arrays working', () => {
    const normalized = normalizeRepositoryList({
      repositories: [
        {
          id: 'repo-1',
          name: 'web',
          full_name: 'org/web',
          url: 'https://github.com/org/web',
          provider: 'github',
          organization_id: 'org-1',
          is_private: false,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-02T00:00:00Z',
        },
      ],
      total: 1,
      limit: 20,
      offset: 0,
    })

    expect(normalized.repositories[0]).toMatchObject({
      full_name: 'org/web',
      provider: 'github',
      is_private: false,
      stats: {
        total_analyses: 0,
        latest_quality_score: 0,
        has_analysis: false,
        last_analyzed_at: null,
      },
    })
  })
})
