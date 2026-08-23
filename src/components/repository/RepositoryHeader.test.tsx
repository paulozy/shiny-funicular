import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { RepositoryHeader } from './RepositoryHeader'
import { RepositoryResponse } from '@/lib/types/repository'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}))

const repo: RepositoryResponse = {
  id: 'repo-1',
  name: 'web',
  full_name: 'org/web',
  description: 'Frontend principal',
  url: 'https://github.com/org/web',
  provider: 'github',
  is_private: false,
  metadata: { default_branch: 'develop' },
  organization_id: 'org-1',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-02T00:00:00Z',
}

describe('RepositoryHeader', () => {
  it('names the repository and its provenance', () => {
    render(<RepositoryHeader repo={repo} />)

    expect(screen.getByRole('heading', { name: 'web' })).toBeInTheDocument()
    expect(screen.getByText('Frontend principal')).toBeInTheDocument()
    expect(screen.getByText('develop')).toBeInTheDocument()
    expect(screen.getByText('github')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '← Code Hub' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Abrir origem' })).toHaveAttribute(
      'href',
      'https://github.com/org/web'
    )
  })

  // An unowned repository is a governance pendency, so the header says so in
  // the warning tone instead of leaving the slot blank.
  it('flags a repository with no accountable team', () => {
    render(<RepositoryHeader repo={repo} />)

    expect(screen.getByText('sem time responsável')).toBeInTheDocument()
  })

  it('names the owning team when there is one', () => {
    render(<RepositoryHeader repo={{ ...repo, owner_team: { id: 't1', name: 'Plataforma', slug: 'plataforma' } }} />)

    expect(screen.getByText('time Plataforma')).toBeInTheDocument()
  })

  // Sync is a write: a viewer must not be offered a button the API answers
  // with 403.
  it('offers the sync action only to roles that may sync', () => {
    const { rerender } = render(<RepositoryHeader repo={repo} canSync={false} />)
    expect(screen.queryByRole('button', { name: /sincronizar agora/i })).not.toBeInTheDocument()

    rerender(<RepositoryHeader repo={repo} canSync />)
    expect(screen.getByRole('button', { name: /sincronizar agora/i })).toBeInTheDocument()
  })

  // ── the sync button ────────────────────────────────────────────────────────

  describe('sync feedback', () => {
    beforeEach(() => {
      global.fetch = jest.fn() as unknown as typeof fetch
    })

    function answer(status: number, body: unknown) {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: status < 400,
        status,
        json: () => Promise.resolve(body),
      })
    }

    // The POST only enqueues and returns in milliseconds, so a button whose busy
    // state tracks the request flashes and goes straight back to clickable —
    // which let one person queue the same job a dozen times.
    it('stays busy after a queued sync instead of flashing back', async () => {
      answer(202, { status: 'queued', type: 'repo:sync', target: 'repo-1' })
      render(<RepositoryHeader repo={repo} canSync />)

      fireEvent.click(screen.getByRole('button', { name: /sincronizar agora/i }))

      // The label and the status line both say "na fila", so the assertion names
      // the live region rather than matching text twice.
      await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/na fila/i))
      expect(screen.getByRole('button')).toBeDisabled()
    })

    // Being 5 seconds early used to produce the same silence as a missing worker.
    it('says how long to wait when the throttle declines', async () => {
      answer(202, { status: 'throttled', retry_after_seconds: 42 })
      render(<RepositoryHeader repo={repo} canSync />)

      fireEvent.click(screen.getByRole('button', { name: /sincronizar agora/i }))

      await waitFor(() => expect(screen.getByText(/42s/)).toBeInTheDocument())
      // Throttled is not busy: trying again shortly is the correct next action.
      expect(screen.getByRole('button')).not.toBeDisabled()
    })

    // The failure that cost the most debugging time: with no Redis the job was
    // dropped and the API still answered "queued".
    it('says the queue is unavailable on a 503 instead of swallowing it', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 503,
        json: () => Promise.resolve({ error: 'queue_unavailable' }),
      })
      render(<RepositoryHeader repo={repo} canSync />)

      fireEvent.click(screen.getByRole('button', { name: /sincronizar agora/i }))

      await waitFor(() => expect(screen.getByText(/fila de jobs indispon/i)).toBeInTheDocument())
      expect(screen.getByText(/redis/i)).toBeInTheDocument()
    })

    // A sync someone else started must disable the button too, or two people
    // double-queue the same repository.
    it('is disabled while the repository is already syncing', () => {
      render(<RepositoryHeader repo={{ ...repo, sync_status: 'syncing' }} canSync />)

      const button = screen.getByRole('button', { name: /sincronizando/i })
      expect(button).toBeDisabled()
    })
  })
})
