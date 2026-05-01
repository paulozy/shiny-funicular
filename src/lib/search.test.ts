import {
  buildFileStubHref,
  buildSemanticSearchQuery,
  formatSearchScore,
  getDefaultSearchBranch,
  normalizeMinScore,
  normalizeSearchLimit,
} from './search'

describe('search utilities', () => {
  it('formats scores as rounded percentages', () => {
    expect(formatSearchScore(0.91)).toBe('91%')
    expect(formatSearchScore(0.914)).toBe('91%')
    expect(formatSearchScore(0.915)).toBe('92%')
  })

  it('uses repository default branch or main', () => {
    expect(getDefaultSearchBranch({ metadata: { default_branch: 'develop' } })).toBe('develop')
    expect(getDefaultSearchBranch({ metadata: {} })).toBe('main')
    expect(getDefaultSearchBranch(null)).toBe('main')
  })

  it('normalizes limit and min score', () => {
    expect(normalizeSearchLimit('20')).toBe(20)
    expect(normalizeSearchLimit('99')).toBe(10)
    expect(normalizeMinScore('0.7')).toBe(0.7)
    expect(normalizeMinScore('2')).toBe(0.55)
  })

  it('builds semantic search querystrings', () => {
    expect(
      buildSemanticSearchQuery({
        q: ' token refresh ',
        branch: 'main',
        limit: 50,
        min_score: 0.6,
      })
    ).toBe('q=token+refresh&limit=50&branch=main&min_score=0.6')
  })

  it('builds file stub links', () => {
    expect(
      buildFileStubHref('repo-1', {
        file_path: 'src/lib/auth.ts',
        branch: 'main',
        start_line: 10,
        end_line: 20,
      })
    ).toBe('/code/repositories/repo-1/files?path=src%2Flib%2Fauth.ts&branch=main&start_line=10&end_line=20')
  })
})
