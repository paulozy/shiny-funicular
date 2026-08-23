import { fireEvent, render, screen } from '@testing-library/react'
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

  // A pull request with dozens of files is unreadable if every patch is open;
  // the header stays, the body folds away.
  it('can start collapsed, showing only the file header', () => {
    render(<DiffView file={file} defaultOpen={false} />)

    expect(screen.getByText('internal/svc/a.go')).toBeInTheDocument()
    expect(screen.queryByText(/added on line two/)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { expanded: false }))
    expect(screen.getByText(/added on line two/)).toBeInTheDocument()
  })

  // Lockfiles and vendored bundles would otherwise paint tens of thousands of
  // rows and take the tab with them.
  it('holds back the tail of a very large patch until asked', () => {
    const lines = Array.from({ length: 420 }, (_, i) => `+line ${i}`)
    render(
      <DiffView
        file={{ ...file, additions: 420, changes: 420, patch: ['@@ -0,0 +1,420 @@', ...lines].join('\n') }}
      />
    )

    // The leading "+" is its own gutter cell, so the row's text is the content.
    expect(screen.getByText('line 299')).toBeInTheDocument()
    expect(screen.queryByText('line 300')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /mostrar as 120 linhas restantes/i }))
    expect(screen.getByText('line 419')).toBeInTheDocument()
  })
})
