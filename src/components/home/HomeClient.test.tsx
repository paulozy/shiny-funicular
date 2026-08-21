import { fireEvent, render, screen } from '@testing-library/react'
import { HomeClient } from '@/app/(app)/HomeClient'
import { UserInfo } from '@/lib/types/auth'
import { RepositoryListResponse } from '@/lib/types/repository'

const push = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  usePathname: () => '/',
}))

const baseUser: UserInfo = {
  id: 'user-1',
  email: 'user@example.com',
  full_name: 'User One',
  role: 'admin',
  organization: {
    id: 'org-1',
    name: 'Org',
    slug: 'org',
    role: 'admin',
  },
}

const repos: RepositoryListResponse = {
  repositories: [
    {
      id: 'repo-1',
      name: 'web',
      full_name: 'org/web',
      url: 'https://github.com/org/web',
      provider: 'github',
      is_private: false,
      stats: {
        has_coverage: true,
        test_coverage: 76,
        coverage_status: 'ok' as const,
      },
      organization_id: 'org-1',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
  ],
  total: 1,
  limit: 20,
  offset: 0,
}

describe('HomeClient', () => {
  beforeEach(() => {
    push.mockClear()
  })

  it('shows a settings action for admins', () => {
    render(<HomeClient user={baseUser} initialRepos={repos} orgConfig={null} />)

    fireEvent.click(screen.getByRole('button', { name: /configurações/i }))

    expect(push).toHaveBeenCalledWith('/settings')
  })

  it('does not show the settings action for non-admin users', () => {
    render(<HomeClient user={{ ...baseUser, role: 'developer' }} initialRepos={repos} orgConfig={null} />)

    expect(screen.queryByRole('button', { name: /configurações/i })).not.toBeInTheDocument()
  })

  it('opens the repository actions menu and navigates to repository settings', () => {
    render(<HomeClient user={baseUser} initialRepos={repos} orgConfig={null} />)

    fireEvent.click(screen.getByRole('button', { name: /abrir menu de web/i }))
    fireEvent.click(screen.getByRole('menuitem', { name: /^configurações$/i }))

    expect(push).toHaveBeenCalledWith('/code/repositories/repo-1/settings')
  })

  // Semantic search is gone, so its menu entry must not linger and route the
  // user to a dead page.
  it('offers no semantic-search entry in the repository actions menu', () => {
    render(<HomeClient user={baseUser} initialRepos={repos} orgConfig={null} />)

    fireEvent.click(screen.getByRole('button', { name: /abrir menu de web/i }))

    expect(screen.queryByRole('menuitem', { name: /buscar no repositório/i })).not.toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /configurações/i })).toBeInTheDocument()
  })

  it('links repository names to the overview page', () => {
    render(<HomeClient user={baseUser} initialRepos={repos} orgConfig={null} />)

    expect(screen.getByRole('link', { name: 'web' })).toHaveAttribute('href', '/code/repositories/repo-1')
  })

  it('renders the repository card with stretched-link structure so the whole card is clickable', () => {
    render(<HomeClient user={baseUser} initialRepos={repos} orgConfig={null} />)

    const repoLink = screen.getByRole('link', { name: 'web' })
    expect(repoLink).toHaveClass('repo-card-link')

    // The link must live inside an element with the `.repo-card` class so the
    // `::after` overlay defined in globals.css covers the whole card surface.
    const card = repoLink.closest('.repo-card')
    expect(card).not.toBeNull()
    expect(card).toHaveAttribute('class', expect.stringContaining('repo-card'))
  })

  it('clicking the repository actions menu does not navigate to the repository overview', () => {
    render(<HomeClient user={baseUser} initialRepos={repos} orgConfig={null} />)

    fireEvent.click(screen.getByRole('button', { name: /abrir menu de web/i }))

    expect(push).not.toHaveBeenCalledWith('/code/repositories/repo-1')
  })

  it('renders repository cards without analysis/quality artifacts', () => {
    render(
      <HomeClient
        user={baseUser}
        orgConfig={null}
        initialRepos={{
          ...repos,
          repositories: [
            repos.repositories[0],
            {
              ...repos.repositories[0],
              id: 'repo-2',
              name: 'api',
              full_name: 'org/api',
              stats: {
                has_coverage: false,
              },
            },
          ],
          total: 2,
        }}
      />
    )

    // repository names still render
    expect(screen.getByText('api')).toBeInTheDocument()
    // analysis-derived UI is gone from the cards
    expect(screen.queryByLabelText(/qualidade .* de 100/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/sem análise/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/\breviews\b/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/\banálises\b/i)).not.toBeInTheDocument()
  })
})
