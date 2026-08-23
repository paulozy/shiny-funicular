import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { ContributorResponse } from '@/lib/types/contributor'
import { ContributorsClient } from './ContributorsClient'

function contributor(overrides: Partial<ContributorResponse> = {}): ContributorResponse {
  return {
    login: 'paulozy',
    commits: 240,
    open_change_requests: 2,
    last_commit_at: '2026-08-21T10:00:00Z',
    ...overrides,
  }
}

describe('ContributorsClient', () => {
  it('renders the identity and the full metadata line', () => {
    render(<ContributorsClient items={[contributor()]} loadError={null} />)

    expect(screen.getByText('paulozy')).toBeInTheDocument()
    expect(screen.getByText(/240 commits/)).toBeInTheDocument()
    expect(screen.getByText(/2 PRs abertos/)).toBeInTheDocument()
    expect(screen.getByText(/último commit/)).toBeInTheDocument()
  })

  // The whole point of the nullable fields: "we could not determine this" must
  // not render as a measured zero.
  it('omits derived facts the backend could not determine', () => {
    render(
      <ContributorsClient
        items={[contributor({ open_change_requests: null, last_commit_at: null })]}
        loadError={null}
      />
    )

    expect(screen.getByText(/240 commits/)).toBeInTheDocument()
    expect(screen.queryByText(/PRs abertos/)).not.toBeInTheDocument()
    expect(screen.queryByText(/0 PRs/)).not.toBeInTheDocument()
    expect(screen.queryByText(/último commit/)).not.toBeInTheDocument()
  })

  it('renders a genuine zero when the backend did measure it', () => {
    render(
      <ContributorsClient
        items={[contributor({ open_change_requests: 0, last_commit_at: null })]}
        loadError={null}
      />
    )
    expect(screen.getByText(/0 PRs abertos/)).toBeInTheDocument()
  })

  // GitLab reports a display name and no username; GitHub the reverse.
  it('falls back to the display name when there is no login', () => {
    render(
      <ContributorsClient
        items={[contributor({ login: undefined, name: 'Paulo Abreu' })]}
        loadError={null}
      />
    )
    expect(screen.getByText('Paulo Abreu')).toBeInTheDocument()
  })

  it('singularizes a lone commit and a lone PR', () => {
    render(
      <ContributorsClient
        items={[contributor({ commits: 1, open_change_requests: 1 })]}
        loadError={null}
      />
    )
    expect(screen.getByText(/1 commit ·/)).toBeInTheDocument()
    expect(screen.getByText(/1 PR aberto/)).toBeInTheDocument()
  })

  it('shows an empty state rather than an empty panel', () => {
    render(<ContributorsClient items={[]} loadError={null} />)
    expect(screen.getByText(/Nenhum contribuidor reportado/)).toBeInTheDocument()
  })

  // A missing provider token is a load failure, not "this repo has nobody".
  it('surfaces a load error instead of an empty state', () => {
    render(<ContributorsClient items={[]} loadError="provider unavailable" />)
    expect(screen.getByText(/Não foi possível carregar os contribuidores/)).toBeInTheDocument()
    expect(screen.queryByText(/Nenhum contribuidor reportado/)).not.toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <ContributorsClient items={[contributor()]} loadError={null} />
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
