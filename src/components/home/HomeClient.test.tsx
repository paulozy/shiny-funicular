import { fireEvent, render, screen } from '@testing-library/react'
import { HomeClient } from '@/app/(app)/HomeClient'
import { UserInfo } from '@/lib/types/auth'
import { RepositoryListResponse } from '@/lib/types/repository'

const push = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}))

jest.mock('@/components/home/CoPensador', () => ({
  CoPensador: () => null,
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
      analysis_status: 'completed',
      reviews_count: 5,
      stats: {
        total_analyses: 10,
        latest_quality_score: 85,
        has_analysis: true,
        last_analyzed_at: '2026-04-30T14:23:15.123Z',
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

  it('navigates from the repository actions menu to semantic search', () => {
    render(<HomeClient user={baseUser} initialRepos={repos} orgConfig={null} />)

    fireEvent.click(screen.getByRole('button', { name: /abrir menu de web/i }))
    fireEvent.click(screen.getByRole('menuitem', { name: /buscar no repositório/i }))

    expect(push).toHaveBeenCalledWith('/code/repositories/repo-1/search?branch=main')
  })

  it('links repository names to the overview page', () => {
    render(<HomeClient user={baseUser} initialRepos={repos} orgConfig={null} />)

    expect(screen.getByRole('link', { name: 'web' })).toHaveAttribute('href', '/code/repositories/repo-1')
  })

  it('shows enriched analysis quality and empty analysis state in repository cards', () => {
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
              analysis_status: null,
              reviews_count: null,
              stats: {
                total_analyses: 0,
                latest_quality_score: 0,
                has_analysis: false,
                last_analyzed_at: null,
              },
            },
          ],
          total: 2,
        }}
      />
    )

    expect(screen.getByLabelText(/qualidade 85 de 100/i)).toBeInTheDocument()
    expect(screen.getByText(/concluída/i)).toBeInTheDocument()
    expect(screen.getByText(/5 reviews/i)).toBeInTheDocument()
    expect(screen.getByText(/10 análises/i)).toBeInTheDocument()
    expect(screen.getByText(/sem análise/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/qualidade 0 de 100/i)).not.toBeInTheDocument()
  })
})
