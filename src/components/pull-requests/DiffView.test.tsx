import { render, screen } from '@testing-library/react'
import { DiffView } from './DiffView'
import { CodeIssue, PullRequestFileResponse } from '@/lib/types/pull_request'

const file: PullRequestFileResponse = {
  sha: 'abc',
  filename: 'internal/svc/a.go',
  status: 'modified',
  additions: 1,
  deletions: 0,
  changes: 1,
  patch: ['@@ -1,2 +1,3 @@', ' first context', '+added on line two', ' second context'].join('\n'),
}

describe('DiffView', () => {
  it('renders the filename and diff content', () => {
    render(<DiffView file={file} issues={[]} />)
    expect(screen.getByText('internal/svc/a.go')).toBeInTheDocument()
    expect(screen.getByText(/added on line two/)).toBeInTheDocument()
  })

  it('anchors a finding on a line present in the diff', () => {
    const issues: CodeIssue[] = [
      { severity: 'error', category: 'bug', title: 'Null deref possível', description: 'x', file: file.filename, line: 2 },
    ]
    render(<DiffView file={file} issues={issues} />)
    expect(screen.getByText('Null deref possível')).toBeInTheDocument()
  })

  it('falls back to a listed finding when its line is not in the diff', () => {
    const issues: CodeIssue[] = [
      { severity: 'warning', category: 'style', title: 'Fora do diff', description: 'y', file: file.filename, line: 999 },
    ]
    render(<DiffView file={file} issues={issues} />)
    // still shown (not dropped), with its location since it is not anchored inline
    expect(screen.getByText('Fora do diff')).toBeInTheDocument()
    expect(screen.getByText(/internal\/svc\/a\.go:999/)).toBeInTheDocument()
  })
})
