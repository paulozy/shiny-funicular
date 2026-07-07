// GitHub's `open_issues_count` (stored on the repo metadata as `issue_count`)
// counts open issues AND open pull requests. To show a real issue count next
// to the PR count, subtract the open PRs.
export function openIssueCount(
  metadata?: { issue_count?: number; pr_count?: number } | null
): number {
  return Math.max(0, (metadata?.issue_count ?? 0) - (metadata?.pr_count ?? 0))
}
