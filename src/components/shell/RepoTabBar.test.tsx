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

  it('renders the four repository sections with correct hrefs', () => {
    render(<RepoTabBar repoId="repo-1" />)

    expect(screen.getByRole('link', { name: 'Visão geral' })).toHaveAttribute('href', '/code/repositories/repo-1')
    expect(screen.getByRole('link', { name: 'Pull Requests' })).toHaveAttribute(
      'href',
      '/code/repositories/repo-1/pull-requests'
    )
    expect(screen.getByRole('link', { name: 'Buscar' })).toHaveAttribute('href', '/code/repositories/repo-1/search')
    expect(screen.getByRole('link', { name: 'Configurações' })).toHaveAttribute(
      'href',
      '/code/repositories/repo-1/settings'
    )
    // Removed for the MVP (analysis/stub):
    expect(screen.queryByRole('link', { name: 'Alertas' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Arquivos' })).not.toBeInTheDocument()
  })

  it('marks the pull-requests tab as active for nested pull-requests paths', () => {
    mockPathname = '/code/repositories/repo-1/pull-requests'
    render(<RepoTabBar repoId="repo-1" />)
    expect(screen.getByRole('link', { name: 'Pull Requests' })).toHaveAttribute('aria-current', 'page')
  })

  it('marks the overview tab as active on the repository root path', () => {
    mockPathname = '/code/repositories/repo-1'
    render(<RepoTabBar repoId="repo-1" />)

    expect(screen.getByRole('link', { name: 'Visão geral' })).toHaveAttribute('aria-current', 'page')
  })

  it('marks the search tab as active for any nested search path', () => {
    mockPathname = '/code/repositories/repo-1/search'
    render(<RepoTabBar repoId="repo-1" />)

    expect(screen.getByRole('link', { name: 'Buscar' })).toHaveAttribute('aria-current', 'page')
  })

  it('respects the activeTab override when the pathname is ambiguous', () => {
    mockPathname = '/code/repositories/repo-1/pull-requests/42'
    render(<RepoTabBar repoId="repo-1" activeTab="pull-requests" />)

    expect(screen.getByRole('link', { name: 'Pull Requests' })).toHaveAttribute('aria-current', 'page')
  })
})
