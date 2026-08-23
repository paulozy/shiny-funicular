import { render, screen } from '@testing-library/react'
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
})
