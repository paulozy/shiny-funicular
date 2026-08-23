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
  it('links the title to the in-IDP detail page and keeps a link to the provider', () => {
    render(<PullRequestCard item={baseItem} repoId="r1" />)
    expect(screen.getByText('#42')).toBeInTheDocument()

    const title = screen.getByRole('link', { name: 'Refactor auth middleware' })
    expect(title).toHaveAttribute('href', '/code/repositories/r1/pull-requests/42')

    const providerLink = screen.getByRole('link', { name: 'Abrir no provedor' })
    expect(providerLink).toHaveAttribute('href', 'https://github.com/owner/repo/pull/42')
    expect(providerLink).toHaveAttribute('target', '_blank')
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

// GitHub's list endpoint carries no diff stats — only the detail call does.
// Rendering the resulting nulls as zeros told every pull request in the list
// that it changed nothing, while the drawer showed the real "+278 −282".
describe('PullRequestCard diff stats', () => {
  const withStats = (stats: Partial<PullRequestListItemResponse['pull_request']>) => ({
    pull_request: { ...baseItem.pull_request, ...stats },
  })

  it('omits the diff stats the provider did not report', () => {
    render(
      <PullRequestCard
        item={withStats({
          changed_files: null,
          additions_count: null,
          deletions_count: null,
          commits_count: null,
        })}
        repoId="r1"
      />
    )

    expect(screen.queryByText(/arquivo/)).not.toBeInTheDocument()
    expect(screen.queryByText('+0')).not.toBeInTheDocument()
    expect(screen.queryByText('-0')).not.toBeInTheDocument()
    expect(screen.queryByText(/commits/)).not.toBeInTheDocument()
  })

  it('shows them when the provider did report them', () => {
    render(
      <PullRequestCard
        item={withStats({
          changed_files: 2,
          additions_count: 278,
          deletions_count: 282,
          commits_count: 5,
        })}
        repoId="r1"
      />
    )

    expect(screen.getByText('+278')).toBeInTheDocument()
    expect(screen.getByText('-282')).toBeInTheDocument()
    expect(screen.getByText(/2 arquivos/)).toBeInTheDocument()
  })

  // A measured zero is a fact and must still render.
  it('keeps a genuine zero', () => {
    render(
      <PullRequestCard
        item={withStats({
          changed_files: 0,
          additions_count: 0,
          deletions_count: 0,
          commits_count: 1,
        })}
        repoId="r1"
      />
    )

    expect(screen.getByText(/0 arquivos/)).toBeInTheDocument()
  })
})
