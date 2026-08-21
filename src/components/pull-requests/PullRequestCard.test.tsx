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

  it('links to the PR detail page', () => {
    render(<PullRequestCard item={baseItem} repoId="r1" />)
    expect(screen.getByRole('link', { name: /ver alterações/i })).toHaveAttribute(
      'href',
      '/code/repositories/r1/pull-requests/42'
    )
  })

  // The AI review pipeline is gone: the card must not advertise reviews or
  // finding counts anymore.
  it('shows no review affordance', () => {
    render(<PullRequestCard item={baseItem} repoId="r1" />)
    expect(screen.queryByText(/revisão/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /revisar pr/i })).not.toBeInTheDocument()
  })
})
