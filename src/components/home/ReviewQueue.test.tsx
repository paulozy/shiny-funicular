import { render, screen } from '@testing-library/react'
import { ReviewQueue, ReviewQueueItem } from './ReviewQueue'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/',
}))

function item(overrides: Partial<ReviewQueueItem> = {}): ReviewQueueItem {
  return {
    repoId: 'repo-1',
    repoName: 'paulozy/shiny-funicular',
    number: 36,
    title: 'chore(deps-dev): bump eslint',
    author: 'dependabot[bot]',
    updatedAt: '2026-08-01T10:00:00Z',
    additions: null,
    deletions: null,
    changedFiles: null,
    draft: false,
    ...overrides,
  }
}

describe('ReviewQueue diff stats', () => {
  // GitHub's list endpoint carries no diff stats, so the queue used to render
  // "0 arquivos +0 -0" for every row while the drawer — which fetches the
  // detail — showed the real "+278 −282 em 2 arquivos".
  it('omits the stats the provider did not report', () => {
    render(<ReviewQueue items={[item()]} />)

    expect(screen.getByText(/bump eslint/)).toBeInTheDocument()
    expect(screen.queryByText(/arquivo/)).not.toBeInTheDocument()
    expect(screen.queryByText('+0')).not.toBeInTheDocument()
  })

  it('shows them when the provider did report them', () => {
    render(<ReviewQueue items={[item({ changedFiles: 2, additions: 278, deletions: 282 })]} />)

    expect(screen.getByText(/2 arquivos/)).toBeInTheDocument()
    expect(screen.getByText('+278')).toBeInTheDocument()
    expect(screen.getByText('−282')).toBeInTheDocument()
  })

  // A measured zero is a fact, not an absence.
  it('keeps a genuine zero', () => {
    render(<ReviewQueue items={[item({ changedFiles: 0, additions: 0, deletions: 0 })]} />)
    expect(screen.getByText(/0 arquivos/)).toBeInTheDocument()
  })

  it('singularizes a single file', () => {
    render(<ReviewQueue items={[item({ changedFiles: 1, additions: 3, deletions: 1 })]} />)
    expect(screen.getByText(/1 arquivo(?!s)/)).toBeInTheDocument()
  })
})
