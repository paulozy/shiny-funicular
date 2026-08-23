// GitHub's `open_issues_count` (stored on the repo metadata as `issue_count`)
// counts open issues AND open pull requests. To show a real issue count next
// to the PR count, subtract the open PRs.

interface RepoCounts {
  issue_count?: number
  pr_count?: number
}

export function openIssueCount(metadata?: RepoCounts | null): number {
  return Math.max(0, (metadata?.issue_count ?? 0) - (metadata?.pr_count ?? 0))
}

/**
 * The same correction, but preserving "never measured".
 *
 * `openIssueCount` answers 0 for a repository that has never synced, which is
 * right where a stat block needs a number. It is wrong on a tab label: the tab
 * bar renders no count at all for `undefined`, deliberately, so that an
 * unsynced repository does not claim a measured zero.
 *
 * Use this wherever the difference between "zero issues" and "we do not know"
 * is visible to the reader. It is what the repository tab bar was missing —
 * it received `issue_count` raw and showed a repository's open PR count on the
 * Issues tab.
 */
export function knownOpenIssueCount(metadata?: RepoCounts | null): number | undefined {
  if (metadata?.issue_count === undefined) return undefined
  return openIssueCount(metadata)
}
