import { render, screen, within } from '@testing-library/react'
import { PullRequestList } from './PullRequestList'
import { PullRequestListItemResponse } from '@/lib/types/pull_request'

function makeItem(overrides: Partial<PullRequestListItemResponse['pull_request']>): PullRequestListItemResponse {
  return {
    pull_request: {
      id: overrides.id ?? Math.random(),
      number: overrides.number ?? 1,
      title: overrides.title ?? 'PR title',
      state: 'open',
      author_login: 'user',
      head_branch: 'feat/x',
      head_sha: 'abc',
      base_branch: 'main',
      base_sha: 'def',
      draft: overrides.draft ?? false,
      commits_count: 1,
      changed_files: 1,
      additions_count: 0,
      deletions_count: 0,
      html_url: 'https://github.com/owner/repo/pull/1',
      created_at: '2026-05-01T00:00:00Z',
      updated_at: overrides.updated_at ?? '2026-05-01T00:00:00Z',
      ...overrides,
    },
  }
}

describe('PullRequestList', () => {
  it('renders empty state when no items', () => {
    render(<PullRequestList items={[]} />)
    expect(screen.getByText('Nenhum PR aberto no momento.')).toBeInTheDocument()
  })

  it('groups drafts separately from open PRs', () => {
    const items = [
      makeItem({ id: 1, number: 1, title: 'Open one', draft: false }),
      makeItem({ id: 2, number: 2, title: 'Draft one', draft: true }),
    ]
    render(<PullRequestList items={items} />)

    const openSection = screen.getByRole('region', { name: 'PRs abertos' })
    const draftSection = screen.getByRole('region', { name: 'PRs draft' })

    expect(within(openSection).getByText('Open one')).toBeInTheDocument()
    expect(within(draftSection).getByText('Draft one')).toBeInTheDocument()
    expect(within(openSection).queryByText('Draft one')).not.toBeInTheDocument()
  })

  it('sorts each group by updated_at desc', () => {
    const items = [
      makeItem({ id: 1, number: 1, title: 'Older', updated_at: '2026-05-01T00:00:00Z' }),
      makeItem({ id: 2, number: 2, title: 'Newer', updated_at: '2026-05-18T00:00:00Z' }),
    ]
    render(<PullRequestList items={items} />)
    const titles = screen.getAllByRole('link').map((a) => a.textContent)
    expect(titles[0]).toBe('Newer')
    expect(titles[1]).toBe('Older')
  })

  it('hides the open section when there are no open PRs', () => {
    const items = [makeItem({ id: 1, number: 1, title: 'Only draft', draft: true })]
    render(<PullRequestList items={items} />)
    expect(screen.queryByRole('region', { name: 'PRs abertos' })).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'PRs draft' })).toBeInTheDocument()
  })
})
