import { knownOpenIssueCount, openIssueCount } from './repo-metrics'

describe('openIssueCount', () => {
  it('subtracts open PRs from GitHub open_issues_count', () => {
    expect(openIssueCount({ issue_count: 8, pr_count: 6 })).toBe(2)
  })

  it('never goes negative', () => {
    expect(openIssueCount({ issue_count: 3, pr_count: 5 })).toBe(0)
  })

  it('treats a missing pr_count as zero', () => {
    expect(openIssueCount({ issue_count: 4 })).toBe(4)
  })
})

describe('knownOpenIssueCount', () => {
  // The bug this exists for: the repository tab bar received `issue_count`
  // raw, so a repo with 0 issues and 6 open PRs showed "Issues · 6".
  it('applies the same correction as openIssueCount', () => {
    expect(knownOpenIssueCount({ issue_count: 6, pr_count: 6 })).toBe(0)
    expect(knownOpenIssueCount({ issue_count: 8, pr_count: 6 })).toBe(2)
  })

  // The tab bar renders no count for undefined, deliberately, so an unsynced
  // repository does not claim a measured zero.
  it('preserves "never measured"', () => {
    expect(knownOpenIssueCount({})).toBeUndefined()
    expect(knownOpenIssueCount(null)).toBeUndefined()
    expect(knownOpenIssueCount(undefined)).toBeUndefined()
  })

  it('reports a real measured zero as zero', () => {
    expect(knownOpenIssueCount({ issue_count: 0, pr_count: 0 })).toBe(0)
  })
})
