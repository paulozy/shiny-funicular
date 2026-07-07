import { openIssueCount } from './repo-metrics'

describe('openIssueCount', () => {
  it('subtracts open PRs from GitHub open_issues_count', () => {
    expect(openIssueCount({ issue_count: 8, pr_count: 6 })).toBe(2)
  })

  it('never goes negative', () => {
    expect(openIssueCount({ issue_count: 3, pr_count: 5 })).toBe(0)
  })

  it('handles missing fields', () => {
    expect(openIssueCount(undefined)).toBe(0)
    expect(openIssueCount({})).toBe(0)
    expect(openIssueCount({ issue_count: 4 })).toBe(4)
  })
})
