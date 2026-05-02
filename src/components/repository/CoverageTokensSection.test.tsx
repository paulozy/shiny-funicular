import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { CoverageTokensSection } from './CoverageTokensSection'
import { apiFetch } from '@/lib/api/client'
import { RepositoryResponse } from '@/lib/types/repository'

jest.mock('@/lib/api/client', () => ({
  apiFetch: jest.fn(),
}))

const repo: RepositoryResponse = {
  id: 'repo-1',
  name: 'web',
  full_name: 'org/web',
  url: 'https://github.com/org/web',
  provider: 'github',
  is_private: false,
  organization_id: 'org-1',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

beforeEach(() => {
  ;(apiFetch as jest.Mock).mockReset()
})

describe('CoverageTokensSection', () => {
  it('shows empty state when no tokens exist', async () => {
    ;(apiFetch as jest.Mock).mockResolvedValueOnce([])

    render(<CoverageTokensSection repo={repo} canManage={true} />)

    expect(await screen.findByText(/Ainda não há tokens criados/)).toBeInTheDocument()
    expect(apiFetch).toHaveBeenCalledWith('/api/repositories/repo-1/coverage/tokens')
  })

  it('lists existing tokens', async () => {
    ;(apiFetch as jest.Mock).mockResolvedValueOnce([
      {
        id: 't-1',
        name: 'github-actions',
        last_used_at: null,
        expires_at: null,
        created_at: '2026-01-02T00:00:00Z',
      },
    ])

    render(<CoverageTokensSection repo={repo} canManage={true} />)

    expect(await screen.findByText('github-actions')).toBeInTheDocument()
    expect(screen.getByText('Ativo')).toBeInTheDocument()
  })

  it('hides the new-token button when canManage is false', async () => {
    ;(apiFetch as jest.Mock).mockResolvedValueOnce([])

    render(<CoverageTokensSection repo={repo} canManage={false} />)

    await waitFor(() => expect(apiFetch).toHaveBeenCalled())
    expect(screen.queryByRole('button', { name: /Novo token/i })).not.toBeInTheDocument()
  })

  it('displays an error alert when listing fails', async () => {
    ;(apiFetch as jest.Mock).mockRejectedValueOnce(new Error('boom'))

    render(<CoverageTokensSection repo={repo} canManage={true} />)

    expect(await screen.findByText('boom')).toBeInTheDocument()
  })

  it('shows the repository ID for CI configuration', () => {
    ;(apiFetch as jest.Mock).mockResolvedValueOnce([])

    render(<CoverageTokensSection repo={repo} canManage={true} />)

    expect(screen.getByText(repo.id)).toBeInTheDocument()
  })

  it('marks revoked tokens as inactive', async () => {
    ;(apiFetch as jest.Mock).mockResolvedValueOnce([
      {
        id: 't-2',
        name: 'old-token',
        revoked_at: '2026-02-01T00:00:00Z',
        created_at: '2026-01-15T00:00:00Z',
      },
    ])

    render(<CoverageTokensSection repo={repo} canManage={true} />)

    expect(await screen.findByText('old-token')).toBeInTheDocument()
    expect(screen.getByText('Revogado')).toBeInTheDocument()
  })

  it('opens the new-token modal when the button is clicked', async () => {
    ;(apiFetch as jest.Mock).mockResolvedValueOnce([])

    render(<CoverageTokensSection repo={repo} canManage={true} />)

    await screen.findByText(/Ainda não há tokens/)
    fireEvent.click(screen.getByRole('button', { name: /Novo token/i }))

    // Modal title in NewCoverageTokenModal
    expect(
      screen.getByText(/Novo token de upload de cobertura/i)
    ).toBeInTheDocument()
  })
})
