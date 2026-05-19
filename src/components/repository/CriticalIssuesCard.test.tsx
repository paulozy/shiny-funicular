import { render, screen } from '@testing-library/react'
import { CriticalIssuesCard } from './CriticalIssuesCard'
import { CodeAnalysis, CodeIssue } from '@/lib/types/analysis'

function makeAnalysis(overrides: Partial<CodeAnalysis> = {}): CodeAnalysis {
  return {
    id: 'a1',
    repository_id: 'r1',
    type: 'code_review',
    status: 'completed',
    issues: [],
    issue_count: 0,
    critical_count: 0,
    error_count: 0,
    warning_count: 0,
    info_count: 0,
    tokens_used: 0,
    created_at: '2026-05-19T00:00:00Z',
    updated_at: '2026-05-19T00:00:00Z',
    ...overrides,
  }
}

function makeIssue(overrides: Partial<CodeIssue>): CodeIssue {
  return {
    severity: 'warning',
    category: 'security',
    title: 'Default title',
    description: '',
    is_ai_generated: true,
    confidence: 0.8,
    ...overrides,
  }
}

describe('CriticalIssuesCard', () => {
  it('renders the empty state when no analysis is provided', () => {
    render(<CriticalIssuesCard analysis={null} repoId="r1" />)
    expect(
      screen.getByText(/Nenhuma análise concluída/i)
    ).toBeInTheDocument()
  })

  it('shows "no critical alerts" when the analysis has no critical/error issues', () => {
    const analysis = makeAnalysis({
      issues: [makeIssue({ severity: 'warning', title: 'Just a warning' })],
    })
    render(<CriticalIssuesCard analysis={analysis} repoId="r1" />)
    expect(screen.getByText(/Sem alertas críticos/i)).toBeInTheDocument()
  })

  it('renders up to 3 critical+error issues sorted by input order', () => {
    const analysis = makeAnalysis({
      issues: [
        makeIssue({ severity: 'critical', title: 'Hardcoded API key', file: 'a.go', line: 10 }),
        makeIssue({ severity: 'error', title: 'Unhandled error', file: 'b.go', line: 22 }),
        makeIssue({ severity: 'warning', title: 'TODO left', file: 'c.go', line: 1 }),
        makeIssue({ severity: 'error', title: 'Race condition', file: 'd.go', line: 99 }),
        makeIssue({ severity: 'critical', title: 'SQL injection', file: 'e.go', line: 42 }),
      ],
    })
    render(<CriticalIssuesCard analysis={analysis} repoId="r1" />)
    expect(screen.getByText('Hardcoded API key')).toBeInTheDocument()
    expect(screen.getByText('Unhandled error')).toBeInTheDocument()
    expect(screen.getByText('Race condition')).toBeInTheDocument()
    // 4th critical (SQL injection) and the warning should be hidden
    expect(screen.queryByText('SQL injection')).not.toBeInTheDocument()
    expect(screen.queryByText('TODO left')).not.toBeInTheDocument()
  })

  it('links each item and the "Ver todos" CTA to the issues tab', () => {
    const analysis = makeAnalysis({
      issues: [makeIssue({ severity: 'critical', title: 'X', file: 'a.go' })],
    })
    render(<CriticalIssuesCard analysis={analysis} repoId="repo-42" />)
    const allLinks = screen.getAllByRole('link')
    for (const link of allLinks) {
      expect(link).toHaveAttribute('href', '/code/repositories/repo-42/issues')
    }
  })
})
