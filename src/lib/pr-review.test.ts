import { buildReviewSubmission, formatSuggestionForCopy, formatAllSuggestionsForCopy } from './pr-review'
import { CodeIssue, PullRequestFileResponse } from '@/lib/types/pull_request'

const file: PullRequestFileResponse = {
  sha: 'abc',
  filename: 'a.go',
  status: 'modified',
  additions: 1,
  deletions: 0,
  changes: 1,
  // new lines present in the diff: 1 (context), 2 (added), 3 (context)
  patch: ['@@ -1,2 +1,3 @@', ' ctx', '+added', ' ctx2'].join('\n'),
}

describe('buildReviewSubmission', () => {
  it('always uses the COMMENT event with a header in the body', () => {
    const out = buildReviewSubmission([file], [], 'resumo')
    expect(out.event).toBe('COMMENT')
    expect(out.body).toContain('Revisão automática')
    expect(out.body).toContain('resumo')
    expect(out.comments).toEqual([])
  })

  it('inlines a medium+ finding whose line is in the diff (RIGHT side)', () => {
    const issues: CodeIssue[] = [
      { severity: 'critical', category: 'security', title: 'Falha', description: 'd', file: 'a.go', line: 2 },
    ]
    const out = buildReviewSubmission([file], issues)
    expect(out.comments).toHaveLength(1)
    expect(out.comments![0]).toMatchObject({ path: 'a.go', line: 2, side: 'RIGHT' })
    expect(out.comments![0].body).toContain('Falha')
  })

  it('folds info-severity findings into the summary instead of inlining them', () => {
    const issues: CodeIssue[] = [
      { severity: 'info', category: 'style', title: 'Nit', description: 'd', file: 'a.go', line: 2 },
    ]
    const out = buildReviewSubmission([file], issues)
    expect(out.comments).toEqual([])
    expect(out.body).toContain('Nit')
  })

  it('folds findings whose line is not in the diff into the summary', () => {
    const issues: CodeIssue[] = [
      { severity: 'error', category: 'bug', title: 'Fora do diff', description: 'd', file: 'a.go', line: 999 },
    ]
    const out = buildReviewSubmission([file], issues)
    expect(out.comments).toEqual([])
    expect(out.body).toContain('Fora do diff')
  })
})

describe('formatSuggestionForCopy', () => {
  it('builds a paste-ready block with file:line, title and suggestion', () => {
    const issue: CodeIssue = {
      severity: 'error', category: 'bug', title: 'Null deref', description: 'd',
      file: 'internal/a.go', line: 88, suggestion: 'Cheque nil antes.',
    }
    const out = formatSuggestionForCopy(issue)
    expect(out).toBe('`internal/a.go:88` — Null deref\n\nCheque nil antes.')
  })

  it('omits the location prefix when there is no file', () => {
    const issue: CodeIssue = { severity: 'info', category: 'x', title: 'T', description: 'd', suggestion: 'S' }
    expect(formatSuggestionForCopy(issue)).toBe('T\n\nS')
  })

  it('joins all suggestions with a horizontal rule', () => {
    const issues: CodeIssue[] = [
      { severity: 'error', category: 'b', title: 'A', description: 'd', file: 'a.go', line: 1, suggestion: 'sa' },
      { severity: 'warning', category: 'b', title: 'B', description: 'd', file: 'b.go', line: 2, suggestion: 'sb' },
    ]
    const out = formatAllSuggestionsForCopy(issues)
    expect(out).toContain('\n\n---\n\n')
    expect(out).toContain('`a.go:1` — A')
    expect(out).toContain('`b.go:2` — B')
  })
})
