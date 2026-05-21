import { render, screen, fireEvent } from '@testing-library/react'
import { IssueCard } from './IssueCard'
import { CodeIssue } from '@/lib/types/analysis'
import { RepositoryResponse } from '@/lib/types/repository'

const baseIssue: CodeIssue = {
  severity: 'warning',
  category: 'security',
  title: 'Potential SQL injection',
  description: 'Uses string concatenation when building a query.',
  suggestion: 'Use parameterised queries.',
  file: 'internal/db/query.go',
  line: 42,
  is_ai_generated: true,
  confidence: 0.91,
}

const repo: RepositoryResponse = {
  id: 'repo-1',
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

describe('IssueCard', () => {
  it('renders title, category, location and description', () => {
    render(<IssueCard issue={baseIssue} repo={repo} />)
    expect(screen.getByText('Potential SQL injection')).toBeInTheDocument()
    expect(screen.getByText('security')).toBeInTheDocument()
    expect(screen.getByText('internal/db/query.go:42')).toBeInTheDocument()
    expect(screen.getByText(/string concatenation/)).toBeInTheDocument()
  })

  it('links the location to the files page with the path', () => {
    render(<IssueCard issue={baseIssue} repo={repo} />)
    const link = screen.getByText('internal/db/query.go:42').closest('a')
    expect(link).toHaveAttribute(
      'href',
      `/code/repositories/repo-1/files?path=${encodeURIComponent('internal/db/query.go')}`
    )
  })

  it('toggles suggestion visibility', () => {
    render(<IssueCard issue={baseIssue} repo={repo} />)
    expect(screen.queryByText('Use parameterised queries.')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /ver sugestão/i }))
    expect(screen.getByText('Use parameterised queries.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /ocultar sugestão/i }))
    expect(screen.queryByText('Use parameterised queries.')).not.toBeInTheDocument()
  })

  it('hides suggestion controls when issue has no suggestion', () => {
    const { suggestion: _suggestion, ...rest } = baseIssue
    render(<IssueCard issue={rest as CodeIssue} repo={repo} />)
    expect(screen.queryByRole('button', { name: /sugestão/i })).not.toBeInTheDocument()
  })

  it('shows "Sem caminho de arquivo" when file is missing', () => {
    const { file: _file, line: _line, ...rest } = baseIssue
    render(<IssueCard issue={rest as CodeIssue} repo={repo} />)
    expect(screen.getByText('Sem caminho de arquivo')).toBeInTheDocument()
  })

  it('shows confidence percent and AI/rule label in footer', () => {
    render(<IssueCard issue={baseIssue} repo={repo} />)
    expect(screen.getByText('91% confiança')).toBeInTheDocument()
    expect(screen.getByText('IA')).toBeInTheDocument()
  })
})
