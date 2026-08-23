import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { IssueResponse } from '@/lib/types/issue'
import { ToastProvider } from '@/components/ui/Toast'
import { IssuesClient } from './IssuesClient'

function issue(overrides: Partial<IssueResponse> = {}): IssueResponse {
  return {
    number: 88,
    title: 'Sidebar não recolhe no mobile',
    state: 'open',
    author_login: 'julia.r',
    labels: ['bug', 'ui'],
    comments_count: 3,
    html_url: 'https://github.com/owner/repo/issues/88',
    created_at: '2026-08-20T10:00:00Z',
    updated_at: '2026-08-20T10:00:00Z',
    ...overrides,
  }
}

function renderIssues(props: Partial<React.ComponentProps<typeof IssuesClient>> = {}) {
  return render(
    <ToastProvider>
      <IssuesClient
        repoId="repo-1"
        items={[issue()]}
        canClose
        loadError={null}
        {...props}
      />
    </ToastProvider>
  )
}

describe('IssuesClient', () => {
  // jsdom ships no fetch, so it is assigned rather than spied on — the same
  // approach the relationship-modal tests use.
  beforeEach(() => {
    global.fetch = jest.fn() as unknown as typeof fetch
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('renders the number, title, labels and metadata', () => {
    renderIssues()

    expect(screen.getByText('#88')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Sidebar não recolhe/ })).toBeInTheDocument()
    expect(screen.getByText('bug')).toBeInTheDocument()
    expect(screen.getByText('ui')).toBeInTheDocument()
    expect(screen.getByText(/aberta por julia\.r/)).toBeInTheDocument()
    expect(screen.getByText(/3 comentários/)).toBeInTheDocument()
  })

  it('singularizes a lone comment', () => {
    renderIssues({ items: [issue({ comments_count: 1 })] })
    expect(screen.getByText(/1 comentário/)).toBeInTheDocument()
  })

  it('shows an empty state when there are no open issues', () => {
    renderIssues({ items: [] })
    expect(screen.getByText('Nenhuma issue aberta neste repositório.')).toBeInTheDocument()
  })

  // A provider that could not be reached is not the same as a repository with
  // no issues, and must not render as one.
  it('surfaces a load error instead of the empty state', () => {
    renderIssues({ items: [], loadError: 'provider unavailable' })
    expect(screen.getByText(/Não foi possível carregar as issues/)).toBeInTheDocument()
    expect(screen.queryByText('Nenhuma issue aberta neste repositório.')).not.toBeInTheDocument()
  })

  it('hides the close action from roles that cannot use it', () => {
    renderIssues({ canClose: false })
    expect(screen.queryByRole('button', { name: 'Fechar issue' })).not.toBeInTheDocument()
  })

  it('removes the issue and confirms once the close succeeds', async () => {
    const user = userEvent.setup()
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true, status: 204 })

    renderIssues()
    await user.click(screen.getByRole('button', { name: 'Fechar issue' }))

    await waitFor(() => {
      expect(screen.getByText('Issue #88 fechada')).toBeInTheDocument()
    })
    expect(screen.getByText('Nenhuma issue aberta neste repositório.')).toBeInTheDocument()
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/repositories/repo-1/issues/88/close',
      expect.objectContaining({ method: 'POST' })
    )
  })

  // The ownership rule lives in the backend and cannot be evaluated here, so a
  // permitted-looking user can still be refused — the row must stay put.
  it('keeps the issue and explains when the backend refuses', async () => {
    const user = userEvent.setup()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ error: 'forbidden' }),
    })

    renderIssues()
    await user.click(screen.getByRole('button', { name: 'Fechar issue' }))

    await waitFor(() => {
      expect(screen.getByText(/não tem permissão para fechar issues/i)).toBeInTheDocument()
    })
    expect(screen.getByRole('link', { name: /Sidebar não recolhe/ })).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = renderIssues()
    expect(await axe(container)).toHaveNoViolations()
  })
})
