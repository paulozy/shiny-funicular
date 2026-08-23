import { render, screen } from '@testing-library/react'
import { RepoTabBar } from './RepoTabBar'

let mockPathname = '/code/repositories/repo-1'

jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}))

describe('RepoTabBar', () => {
  beforeEach(() => {
    mockPathname = '/code/repositories/repo-1'
  })

  it('renders the repository sections with correct hrefs', () => {
    render(<RepoTabBar repoId="repo-1" />)

    expect(screen.getByRole('link', { name: 'Visão geral' })).toHaveAttribute('href', '/code/repositories/repo-1')
    expect(screen.getByRole('link', { name: 'Pull requests' })).toHaveAttribute(
      'href',
      '/code/repositories/repo-1/pull-requests'
    )
    expect(screen.getByRole('link', { name: 'Documentação' })).toHaveAttribute(
      'href',
      '/code/repositories/repo-1/docs'
    )
    expect(screen.getByRole('link', { name: 'Issues' })).toHaveAttribute(
      'href',
      '/code/repositories/repo-1/issues'
    )
    expect(screen.getByRole('link', { name: 'Contribuidores' })).toHaveAttribute(
      'href',
      '/code/repositories/repo-1/people'
    )
    expect(screen.getByRole('link', { name: 'Configurações' })).toHaveAttribute(
      'href',
      '/code/repositories/repo-1/settings'
    )
    // Routes that no longer exist must not be linked:
    expect(screen.queryByRole('link', { name: 'Buscar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Alertas' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Arquivos' })).not.toBeInTheDocument()
  })

  it('marks the pull-requests tab as active for nested pull-requests paths', () => {
    mockPathname = '/code/repositories/repo-1/pull-requests'
    render(<RepoTabBar repoId="repo-1" />)
    expect(screen.getByRole('link', { name: 'Pull requests' })).toHaveAttribute('aria-current', 'page')
  })

  it('shows the open pull request count on the tab when the sync knows it', () => {
    render(<RepoTabBar repoId="repo-1" prCount={4} />)

    expect(screen.getByRole('link', { name: 'Pull requests · 4' })).toBeInTheDocument()
  })

  // The mockup's order: overview, docs, pull requests, issues, contributors,
  // settings. Arquivos is a route without a tab, and stays that way.
  it('renders the six sections in the order the design specifies', () => {
    render(<RepoTabBar repoId="repo-1" />)
    const labels = screen.getAllByRole('link').map((link) => link.textContent)
    expect(labels).toEqual([
      'Visão geral',
      'Documentação',
      'Pull requests',
      'Issues',
      'Contribuidores',
      'Configurações',
    ])
  })

  it('shows issue and contributor counts when the sync knows them', () => {
    render(<RepoTabBar repoId="repo-1" issueCount={2} contributorCount={3} />)

    expect(screen.getByRole('link', { name: 'Issues · 2' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Contribuidores · 3' })).toBeInTheDocument()
  })

  // `issue_count` is omitempty on the backend, so a repository with none — or
  // one that never synced — sends no key. Rendering "· 0" would claim a
  // measured zero for a repository nobody has looked at.
  it('omits the count entirely when the metadata does not carry one', () => {
    render(<RepoTabBar repoId="repo-1" />)

    expect(screen.getByRole('link', { name: 'Issues' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Issues · 0' })).not.toBeInTheDocument()
  })

  it('marks the issues tab as active on the issues path', () => {
    mockPathname = '/code/repositories/repo-1/issues'
    render(<RepoTabBar repoId="repo-1" />)

    expect(screen.getByRole('link', { name: 'Issues' })).toHaveAttribute('aria-current', 'page')
  })

  it('marks the documentation tab as active on the repository docs path', () => {
    mockPathname = '/code/repositories/repo-1/docs'
    render(<RepoTabBar repoId="repo-1" />)

    expect(screen.getByRole('link', { name: 'Documentação' })).toHaveAttribute('aria-current', 'page')
  })

  it('marks the overview tab as active on the repository root path', () => {
    mockPathname = '/code/repositories/repo-1'
    render(<RepoTabBar repoId="repo-1" />)

    expect(screen.getByRole('link', { name: 'Visão geral' })).toHaveAttribute('aria-current', 'page')
  })

  it('respects the activeTab override when the pathname is ambiguous', () => {
    mockPathname = '/code/repositories/repo-1/pull-requests/42'
    render(<RepoTabBar repoId="repo-1" activeTab="pull-requests" />)

    expect(screen.getByRole('link', { name: 'Pull requests' })).toHaveAttribute('aria-current', 'page')
  })
})
