import { fireEvent, render, screen } from '@testing-library/react'
import { HomeClient } from '@/app/(app)/HomeClient'
import { UserInfo } from '@/lib/types/auth'
import { RepositoryListResponse } from '@/lib/types/repository'

const push = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  usePathname: () => '/',
}))

// The API authorizes on the organization membership role and mints both fields
// from the same value, so the fixture keeps them in step.
function userWithRole(role: UserInfo['role']): UserInfo {
  return {
    id: 'user-1',
    email: 'user@example.com',
    full_name: 'User One',
    role,
    organization: { id: 'org-1', name: 'Org', slug: 'org', role },
  }
}

const baseUser: UserInfo = userWithRole('admin')

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
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ items: [], total: 0 }),
    }) as unknown as typeof fetch
  })

  it('links organization settings from the shell header', () => {
    render(<HomeClient user={baseUser} initialRepos={repos} orgConfig={null} />)

    expect(screen.getByRole('link', { name: 'Configurações da organização' })).toHaveAttribute(
      'href',
      '/settings'
    )
  })

  // The API gates repository creation at developer. A viewer that still sees
  // the button would only discover the restriction by clicking it.
  it('hides "Novo repositório" from a viewer', () => {
    render(<HomeClient user={userWithRole('viewer')} initialRepos={repos} orgConfig={null} />)

    expect(screen.queryByRole('button', { name: /novo repo/i })).not.toBeInTheDocument()
  })

  it('shows "Novo repositório" to a developer', () => {
    render(<HomeClient user={userWithRole('developer')} initialRepos={repos} orgConfig={null} />)

    expect(screen.getByRole('button', { name: /novo repositório/i })).toBeInTheDocument()
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

  it('clicking the repository actions menu does not navigate to the repository overview', () => {
    render(<HomeClient user={baseUser} initialRepos={repos} orgConfig={null} />)

    fireEvent.click(screen.getByRole('button', { name: /abrir menu de web/i }))

    expect(push).not.toHaveBeenCalledWith('/code/repositories/repo-1')
  })

  // The queue is streamed by the server, so the page renders whatever subtree
  // it is handed — it must not wait on it or reimplement it.
  it('renders the review slot the server streams in', () => {
    render(
      <HomeClient
        user={baseUser}
        initialRepos={repos}
        orgConfig={null}
        reviewSlot={<div>Aguardando sua revisão</div>}
      />
    )

    expect(screen.getByText('Aguardando sua revisão')).toBeInTheDocument()
  })

  // The standfirst reads the counts already in the catalog payload; making it
  // wait on the queue would defeat the streaming.
  it('summarises the day from the catalog metadata alone', () => {
    render(
      <HomeClient
        user={baseUser}
        orgConfig={null}
        initialRepos={{
          ...repos,
          repositories: [{ ...repos.repositories[0], metadata: { pr_count: 3 } }],
        }}
      />
    )

    expect(screen.getByText(/3 PRs esperam sua revisão/i)).toBeInTheDocument()
  })

  // A repository with no accountable team is the governance pendency the
  // catalog can prove — it must reach the decision queue, not just the row tag.
  it('lists ownerless repositories as decisions', () => {
    render(<HomeClient user={baseUser} initialRepos={repos} orgConfig={null} />)

    expect(screen.getByText('web está sem time responsável')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Atribuir time' })).toHaveAttribute(
      'href',
      '/code/repositories/repo-1/settings'
    )
  })

  // The pendency tag is what makes a failing scorecard visible from the home
  // page; its tooltip has to name the checks, not just count them.
  it('tags a repository with failing maturity checks and names them', () => {
    render(
      <HomeClient
        user={baseUser}
        orgConfig={null}
        initialRepos={{
          ...repos,
          repositories: [
            {
              ...repos.repositories[0],
              scorecard: {
                passing: 4,
                failing: 2,
                not_applicable: 0,
                total: 6,
                verdicts: [
                  { check_id: 'owner', version: 1, title: 'Time responsável definido', status: 'fail', reason: '' },
                  { check_id: 'docs', version: 1, title: 'Documentação gerada', status: 'fail', reason: '' },
                  { check_id: 'ci', version: 1, title: 'Tem CI configurado', status: 'pass', reason: '' },
                ],
              },
            },
          ],
        }}
      />
    )

    const tag = screen.getByText('2 pendências')
    expect(tag).toHaveAttribute('title', 'Time responsável definido · Documentação gerada')
  })

  it('renders repository rows without analysis/quality artifacts', () => {
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
    // analysis-derived UI is gone from the rows
    expect(screen.queryByLabelText(/qualidade .* de 100/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/sem análise/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/\breviews\b/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/\banálises\b/i)).not.toBeInTheDocument()
  })
})

describe('HomeClient scope control', () => {
  beforeEach(() => {
    push.mockClear()
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ items: [], total: 0 }),
    }) as unknown as typeof fetch
  })

  // The bug that made the filter look dead: changing the scope is a soft
  // navigation, so this component never unmounts. `useState(initialRepos)`
  // reads its argument only on mount, so the newly narrowed catalog the server
  // sent was ignored until a full reload.
  it('adopts the catalog the server sends on a soft navigation', () => {
    const { rerender } = render(
      <HomeClient user={baseUser} initialRepos={repos} hasTeams scope="all" />
    )
    expect(screen.getByText('web')).toBeInTheDocument()

    const narrowed = { ...repos, repositories: [], total: 0 }
    rerender(
      <HomeClient
        user={baseUser}
        initialRepos={narrowed}
        hasTeams
        scope="mine"
        orgIsEmpty={false}
      />
    )

    expect(screen.queryByText('web')).not.toBeInTheDocument()
    expect(screen.getByText(/Nenhum reposit\u00f3rio dos seus times/i)).toBeInTheDocument()
  })

  it('always offers the scope control', () => {
    render(<HomeClient user={baseUser} initialRepos={repos} hasTeams scope="all" />)
    expect(screen.getByRole('radio', { name: 'Meus times' })).toBeInTheDocument()
  })

  // The bug this replaced: an admin on no team had the control hidden and the
  // URL parameter ignored, so scoping appeared to do nothing at all.
  it('offers it even to a viewer who is on no team', () => {
    render(<HomeClient user={baseUser} initialRepos={repos} scope="all" />)
    expect(screen.getByRole('radio', { name: 'Meus times' })).toBeInTheDocument()
  })

  it('explains an empty scope instead of showing a bare blank', () => {
    const emptyScope = { ...repos, repositories: [], total: 0 }

    render(
      <HomeClient user={baseUser} initialRepos={emptyScope} scope="mine" orgIsEmpty={false} />
    )

    expect(screen.getByText(/não está em nenhum time/i)).toBeInTheDocument()
  })

  it('says something different when the viewer has teams but they own nothing', () => {
    const emptyScope = { ...repos, repositories: [], total: 0 }

    render(
      <HomeClient
        user={baseUser}
        initialRepos={emptyScope}
        hasTeams
        scope="mine"
        orgIsEmpty={false}
      />
    )

    expect(screen.getByText(/Nenhum reposit\u00f3rio dos seus times/i)).toBeInTheDocument()
  })

  // An organization that owns repositories none of my teams answer for is not
  // an empty organization: scoping to "mine" must not drop the dashboard into
  // the first-run checklist.
  it('does not mistake an empty scope for an empty organization', () => {
    const emptyScope = { ...repos, repositories: [], total: 0 }

    render(
      <HomeClient
        user={baseUser}
        initialRepos={emptyScope}
        hasTeams
        scope="mine"
        orgIsEmpty={false}
      />
    )

    expect(screen.queryByText(/Importar o primeiro reposit/i)).not.toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Meus times' })).toBeInTheDocument()
  })
})
