import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { PullRequestDrawer } from './PullRequestDrawer'

const apiFetch = jest.fn()
jest.mock('@/lib/api/client', () => ({
  apiFetch: (...args: unknown[]) => apiFetch(...args),
}))

const detail = {
  pull_request: {
    id: 1,
    number: 42,
    title: 'Corrige o parser de cobertura',
    body: 'Bumps eslint.\n<details><summary>Release notes</summary><p>notas</p></details>',
    state: 'open',
    author_login: 'paulozy',
    head_branch: 'fix/parser',
    head_sha: 'a',
    base_branch: 'main',
    base_sha: 'b',
    draft: false,
    commits_count: 3,
    changed_files: 2,
    additions_count: 12,
    deletions_count: 3,
    html_url: 'https://github.com/org/web/pull/42',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  files: [],
}

const target = { repoId: 'repo-1', number: 42, title: 'Corrige o parser', repoName: 'web' }

describe('PullRequestDrawer', () => {
  beforeEach(() => {
    apiFetch.mockReset()
    apiFetch.mockResolvedValue(detail)
  })

  it('renders nothing until a pull request is selected', () => {
    const { container } = render(<PullRequestDrawer target={null} onClose={jest.fn()} />)
    expect(container).toBeEmptyDOMElement()
    expect(apiFetch).not.toHaveBeenCalled()
  })

  it('loads the summary for the selected pull request', async () => {
    render(<PullRequestDrawer target={target} onClose={jest.fn()} />)

    expect(apiFetch).toHaveBeenCalledWith('/api/repositories/repo-1/pull-requests/42')

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Corrige o parser de cobertura' })).toBeInTheDocument()
    )
    expect(screen.getByText('3')).toBeInTheDocument() // commits
    expect(screen.getByText('fix/parser → main')).toBeInTheDocument()
  })

  // The sheet is a summary; the diff lives on the page it links to.
  it('links through to the full pull request page', async () => {
    render(<PullRequestDrawer target={target} onClose={jest.fn()} />)

    await waitFor(() => expect(screen.getByRole('link', { name: 'Ver alterações' })).toBeInTheDocument())
    expect(screen.getByRole('link', { name: 'Ver alterações' })).toHaveAttribute(
      'href',
      '/code/repositories/repo-1/pull-requests/42'
    )
  })

  // Bot descriptions are mostly collapsed HTML; the sheet must show the prose
  // and fold the rest, not print tags.
  it('renders the description instead of dumping its HTML', async () => {
    render(<PullRequestDrawer target={target} onClose={jest.fn()} />)

    await waitFor(() => expect(screen.getByText('Bumps eslint.')).toBeInTheDocument())
    expect(screen.getByText('Release notes')).toBeInTheDocument()
    expect(screen.queryByText(/<summary>/)).not.toBeInTheDocument()
  })

  it('closes on Escape', async () => {
    const onClose = jest.fn()
    render(<PullRequestDrawer target={target} onClose={onClose} />)

    fireEvent.keyDown(window, { key: 'Escape' })
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  it('reports a failed load inside the sheet', async () => {
    apiFetch.mockRejectedValue(new Error('502 Bad Gateway'))
    render(<PullRequestDrawer target={target} onClose={jest.fn()} />)

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('502 Bad Gateway'))
  })
})

describe('PullRequestDrawer review actions', () => {
  beforeEach(() => {
    apiFetch.mockReset()
    apiFetch.mockResolvedValue(detail)
  })

  it('hides both verdicts from roles that cannot review', async () => {
    render(<PullRequestDrawer target={{ ...target, provider: 'github' }} onClose={() => {}} />)
    await waitFor(() => expect(apiFetch).toHaveBeenCalled())

    expect(screen.queryByRole('button', { name: 'Aprovar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Solicitar mudanças' })).not.toBeInTheDocument()
  })

  it('offers both verdicts on GitHub', async () => {
    render(
      <PullRequestDrawer target={{ ...target, provider: 'github' }} onClose={() => {}} canReview />
    )
    await waitFor(() => expect(apiFetch).toHaveBeenCalled())

    expect(screen.getByRole('button', { name: 'Aprovar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Solicitar mudanças' })).toBeInTheDocument()
  })

  // GitLab can approve but has no portable "request changes", so offering the
  // button would guarantee a 501. Approve must still be available.
  it('hides only "request changes" on GitLab', async () => {
    render(
      <PullRequestDrawer target={{ ...target, provider: 'gitlab' }} onClose={() => {}} canReview />
    )
    await waitFor(() => expect(apiFetch).toHaveBeenCalled())

    expect(screen.getByRole('button', { name: 'Aprovar' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Solicitar mudanças' })).not.toBeInTheDocument()
  })

  // An unknown provider is treated as incapable rather than assumed capable.
  it('hides "request changes" when the provider is unknown', async () => {
    render(<PullRequestDrawer target={target} onClose={() => {}} canReview />)
    await waitFor(() => expect(apiFetch).toHaveBeenCalled())

    expect(screen.queryByRole('button', { name: 'Solicitar mudanças' })).not.toBeInTheDocument()
  })
})
