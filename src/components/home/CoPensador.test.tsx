import { render, screen } from '@testing-library/react'
import { CoPensador } from './CoPensador'
import { RepositoryListResponse, RepositoryResponse } from '@/lib/types/repository'

jest.mock('remark-gfm', () => jest.fn())

jest.mock('react-markdown', () => {
  const React = require('react')

  function renderInline(text: string, components: any) {
    const linkMatch = text.match(/^\[(.+)\]\((.+)\)$/)
    if (linkMatch && components.a) {
      return components.a({ href: linkMatch[2], children: linkMatch[1] })
    }

    const boldMatch = text.match(/^(.*)\*\*(.+)\*\*(.*)$/)
    if (boldMatch && components.strong) {
      return (
        <>
          {boldMatch[1]}
          {components.strong({ children: boldMatch[2] })}
          {boldMatch[3]}
        </>
      )
    }

    return text
  }

  return function MarkdownMock({ children, components }: any) {
    const lines = String(children).split('\n').filter((line) => line.trim())
    return (
      <>
        {lines.map((line, index) => {
          if (line.startsWith('# ') && components.h1) return <React.Fragment key={index}>{components.h1({ children: line.slice(2) })}</React.Fragment>
          if (line.startsWith('## ') && components.h2) return <React.Fragment key={index}>{components.h2({ children: line.slice(3) })}</React.Fragment>
          if (components.p) return <React.Fragment key={index}>{components.p({ children: renderInline(line, components) })}</React.Fragment>
          return <p key={index}>{line}</p>
        })}
      </>
    )
  }
})

const focusedRepo: RepositoryResponse = {
  id: 'repo-1',
  name: 'web',
  full_name: 'org/web',
  url: 'https://github.com/org/web',
  provider: 'github',
  is_private: false,
  metadata: {
    issue_count: 2,
    test_coverage: 42,
    default_branch: 'main',
  },
  organization_id: 'org-1',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-02T00:00:00Z',
}

const repos: RepositoryListResponse = {
  repositories: [focusedRepo],
  total: 1,
  limit: 20,
  offset: 0,
}

describe('CoPensador', () => {
  it('prioritizes focused repository insights', () => {
    render(<CoPensador repos={repos} focusedRepo={focusedRepo} />)

    expect(screen.getByText(/contexto: web/i)).toBeInTheDocument()
    expect(screen.getByText(/alertas no repo/i)).toBeInTheDocument()
    expect(screen.getByText(/cobertura baixa/i)).toBeInTheDocument()
    expect(screen.getByText(/busca semântica/i)).toBeInTheDocument()
  })

  it('keeps global insights when no repository is focused', () => {
    render(<CoPensador repos={repos} />)

    expect(screen.getByText(/contexto: Code · 1 repos/i)).toBeInTheDocument()
    expect(screen.getByText(/repos com alertas/i)).toBeInTheDocument()
  })

  it('renders search synthesis insights above repository insights', () => {
    render(
      <CoPensador
        repos={repos}
        focusedRepo={focusedRepo}
        searchInsight={{
          status: 'done',
          query: 'login',
          text: '# Fluxo de login\n\nO fluxo de login passa pelo **handler principal**.',
          tokensUsed: 30,
          model: 'claude',
        }}
      />
    )

    expect(screen.getByText(/síntese da busca/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /fluxo de login/i })).toBeInTheDocument()
    expect(screen.getByText(/O fluxo de login passa pelo/i)).toBeInTheDocument()
    expect(screen.getByText('handler principal').tagName).toBe('STRONG')
    expect(screen.getByText(/claude/i)).toBeInTheDocument()
  })

  it('uses enriched analysis stats without treating missing analysis as quality zero', () => {
    render(
      <CoPensador
        repos={repos}
        focusedRepo={{
          ...focusedRepo,
          metadata: { ...focusedRepo.metadata, issue_count: 0, test_coverage: 90 },
          analysis_status: null,
          stats: {
            total_analyses: 0,
            latest_quality_score: 0,
            has_analysis: false,
            last_analyzed_at: null,
          },
        }}
      />
    )

    expect(screen.getByText(/repo sem análise/i)).toBeInTheDocument()
    expect(screen.getByText(/ausência de análise, não baixa qualidade/i)).toBeInTheDocument()
    expect(screen.queryByText(/0\/100/i)).not.toBeInTheDocument()
  })

  it('flags low quality only when the repository has analysis', () => {
    render(
      <CoPensador
        repos={repos}
        focusedRepo={{
          ...focusedRepo,
          metadata: { ...focusedRepo.metadata, issue_count: 0, test_coverage: 90 },
          analysis_status: 'completed',
          stats: {
            total_analyses: 2,
            latest_quality_score: 58,
            has_analysis: true,
            last_analyzed_at: '2026-04-30T14:23:15.123Z',
          },
        }}
      />
    )

    expect(screen.getByText(/qualidade baixa/i)).toBeInTheDocument()
    expect(screen.getByText(/58\/100/i)).toBeInTheDocument()
  })

  it('links file references in rendered synthesis when they match search results', () => {
    render(
      <CoPensador
        repos={repos}
        focusedRepo={focusedRepo}
        searchInsight={{
          status: 'done',
          query: 'refresh token',
          text: 'internal/services/auth_service.go:201-320',
          results: [
            {
              file_path: 'internal/services/auth_service.go',
              content: 'func RefreshTokens() {}',
              language: 'go',
              start_line: 201,
              end_line: 320,
              score: 0.91,
              provider: 'voyage',
              model: 'voyage-code-3',
              branch: 'main',
            },
          ],
        }}
      />
    )

    const link = screen.getByRole('link', { name: 'internal/services/auth_service.go:201-320' })
    expect(link).toHaveAttribute(
      'href',
      '/code/repositories/repo-1/files?path=internal%2Fservices%2Fauth_service.go&branch=main&start_line=201&end_line=320'
    )
  })
})
