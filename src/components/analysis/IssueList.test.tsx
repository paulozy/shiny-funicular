import { render, screen, fireEvent } from '@testing-library/react'
import { IssueList } from './IssueList'
import { CodeIssue } from '@/lib/types/analysis'
import { RepositoryResponse } from '@/lib/types/repository'

const repo: RepositoryResponse = {
  id: 'r1',
  name: 'app',
  full_name: 'org/app',
  url: 'https://github.com/org/app',
  provider: 'github',
  is_private: false,
  metadata: { default_branch: 'main' },
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  organization_id: 'org-1',
}

const issues: CodeIssue[] = [
  {
    severity: 'critical',
    category: 'security',
    title: 'Hardcoded secret',
    description: 'API key in source.',
    file: 'config.go',
    line: 12,
    is_ai_generated: true,
    confidence: 0.9,
  },
  {
    severity: 'warning',
    category: 'performance',
    title: 'N+1 query',
    description: 'Loop over rows triggers a query each iteration.',
    file: 'service.go',
    line: 80,
    is_ai_generated: true,
    confidence: 0.7,
  },
  {
    severity: 'info',
    category: 'style',
    title: 'Missing comment',
    description: 'Exported function without doc.',
    file: 'utils.go',
    is_ai_generated: false,
    confidence: 1,
  },
]

describe('IssueList', () => {
  it('renders all issues grouped by severity', () => {
    render(<IssueList issues={issues} repo={repo} />)
    expect(screen.getByText('Hardcoded secret')).toBeInTheDocument()
    expect(screen.getByText('N+1 query')).toBeInTheDocument()
    expect(screen.getByText('Missing comment')).toBeInTheDocument()
  })

  it('filters out a severity when its chip is toggled off', () => {
    render(<IssueList issues={issues} repo={repo} />)
    // toggle off "Crítico"
    fireEvent.click(screen.getByRole('button', { name: /crítico · 1/i }))
    expect(screen.queryByText('Hardcoded secret')).not.toBeInTheDocument()
    expect(screen.getByText('N+1 query')).toBeInTheDocument()
  })

  it('filters by free text against title, description, file', () => {
    render(<IssueList issues={issues} repo={repo} />)
    fireEvent.change(screen.getByLabelText('Buscar alertas'), { target: { value: 'service.go' } })
    expect(screen.getByText('N+1 query')).toBeInTheDocument()
    expect(screen.queryByText('Hardcoded secret')).not.toBeInTheDocument()
  })

  it('shows the global empty state when the list is empty', () => {
    render(<IssueList issues={[]} repo={repo} />)
    expect(screen.getByText('Nenhum alerta encontrado nessa análise.')).toBeInTheDocument()
  })

  it('shows the filter empty state when filters exclude everything', () => {
    render(<IssueList issues={issues} repo={repo} />)
    fireEvent.change(screen.getByLabelText('Buscar alertas'), { target: { value: 'no-such-text' } })
    expect(
      screen.getByText('Nenhum alerta corresponde aos filtros atuais.')
    ).toBeInTheDocument()
  })
})
