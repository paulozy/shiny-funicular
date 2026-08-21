import { render, screen } from '@testing-library/react'
import { DiffView } from './DiffView'
import { PullRequestFileResponse } from '@/lib/types/pull_request'

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
    render(<DiffView file={file} />)
    expect(screen.getByText('internal/svc/a.go')).toBeInTheDocument()
    expect(screen.getByText(/added on line two/)).toBeInTheDocument()
  })

  it('renders the additions and deletions counters', () => {
    render(<DiffView file={file} />)
    expect(screen.getByText('+1')).toBeInTheDocument()
    expect(screen.getByText('-0')).toBeInTheDocument()
  })

  it('reports when a file carries no patch', () => {
    render(<DiffView file={{ ...file, patch: undefined }} />)
    expect(screen.getByText(/Diff não disponível/)).toBeInTheDocument()
  })
})
