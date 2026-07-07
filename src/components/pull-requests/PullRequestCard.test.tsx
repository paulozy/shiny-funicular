import { render, screen } from '@testing-library/react'
import { PullRequestCard } from './PullRequestCard'
import { PullRequestListItemResponse } from '@/lib/types/pull_request'

const baseItem: PullRequestListItemResponse = {
  pull_request: {
    id: 1,
    number: 42,
    title: 'Refactor auth middleware',
    state: 'open',
    author_login: 'paulozy',
    head_branch: 'feat/auth-refactor',
    head_sha: 'abc',
    base_branch: 'main',
    base_sha: 'def',
    draft: false,
    commits_count: 5,
    changed_files: 7,
    additions_count: 120,
    deletions_count: 35,
    html_url: 'https://github.com/owner/repo/pull/42',
    created_at: '2026-05-15T10:00:00Z',
    updated_at: '2026-05-18T22:00:00Z',
  },
}

describe('PullRequestCard', () => {
  it('links the title to the in-IDP detail page and keeps a GitHub link', () => {
    render(<PullRequestCard item={baseItem} repoId="r1" />)
    expect(screen.getByText('#42')).toBeInTheDocument()

    const title = screen.getByRole('link', { name: 'Refactor auth middleware' })
    expect(title).toHaveAttribute('href', '/code/repositories/r1/pull-requests/42')

    const github = screen.getByRole('link', { name: 'Abrir no GitHub' })
    expect(github).toHaveAttribute('href', 'https://github.com/owner/repo/pull/42')
    expect(github).toHaveAttribute('target', '_blank')
  })

  it('shows "Open" tag for non-draft PRs', () => {
    render(<PullRequestCard item={baseItem} repoId="r1" />)
    expect(screen.getByText('Open')).toBeInTheDocument()
    expect(screen.queryByText('Draft')).not.toBeInTheDocument()
  })

  it('shows "Draft" tag when draft is true', () => {
    const draft = {
      ...baseItem,
      pull_request: { ...baseItem.pull_request, draft: true },
    }
    render(<PullRequestCard item={draft} repoId="r1" />)
    expect(screen.getByText('Draft')).toBeInTheDocument()
    expect(screen.queryByText('Open')).not.toBeInTheDocument()
  })

  it('displays additions, deletions, files and commits', () => {
    render(<PullRequestCard item={baseItem} repoId="r1" />)
    expect(screen.getByText('+120')).toBeInTheDocument()
    expect(screen.getByText('-35')).toBeInTheDocument()
    expect(screen.getByText('7 arquivos')).toBeInTheDocument()
    expect(screen.getByText('5 commits')).toBeInTheDocument()
  })

  it('renders the latest review summary and a link to the review when present', () => {
    const withAnalysis: PullRequestListItemResponse = {
      ...baseItem,
      latest_analysis: {
        id: 'a1',
        repository_id: 'r1',
        pull_request_id: 42,
        type: 'code_review',
        status: 'completed',
        issues: [],
        issue_count: 3,
        critical_count: 1,
        error_count: 0,
        warning_count: 2,
        info_count: 0,
        tokens_used: 1000,
        created_at: '2026-05-18T21:00:00Z',
        updated_at: '2026-05-18T21:00:00Z',
      },
    }
    render(<PullRequestCard item={withAnalysis} repoId="r1" />)
    expect(screen.getByText('1 críticos')).toBeInTheDocument()
    expect(screen.getByText('2 avisos')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ver revisão/i })).toHaveAttribute(
      'href',
      '/code/repositories/r1/pull-requests/42'
    )
  })

  it('offers a "Revisar PR" link when there is no review yet', () => {
    render(<PullRequestCard item={baseItem} repoId="r1" />)
    expect(screen.getByText('Sem revisão ainda.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /revisar pr/i })).toHaveAttribute(
      'href',
      '/code/repositories/r1/pull-requests/42'
    )
  })

  it('shows "nenhum alerta" when a review exists but has zero issues', () => {
    const clean: PullRequestListItemResponse = {
      ...baseItem,
      latest_analysis: {
        id: 'a1',
        repository_id: 'r1',
        pull_request_id: 42,
        type: 'code_review',
        status: 'completed',
        issues: [],
        issue_count: 0,
        critical_count: 0,
        error_count: 0,
        warning_count: 0,
        info_count: 0,
        tokens_used: 1000,
        created_at: '2026-05-18T21:00:00Z',
        updated_at: '2026-05-18T21:00:00Z',
      },
    }
    render(<PullRequestCard item={clean} repoId="r1" />)
    expect(screen.getByText('nenhum alerta')).toBeInTheDocument()
  })
})
