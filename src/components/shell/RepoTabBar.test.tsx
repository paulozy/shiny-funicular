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

  it('renders the six repository sections with correct hrefs', () => {
    render(<RepoTabBar repoId="repo-1" />)

    expect(screen.getByRole('link', { name: 'Visão geral' })).toHaveAttribute('href', '/code/repositories/repo-1')
    expect(screen.getByRole('link', { name: 'Arquivos' })).toHaveAttribute('href', '/code/repositories/repo-1/files')
    expect(screen.getByRole('link', { name: 'Alertas' })).toHaveAttribute('href', '/code/repositories/repo-1/issues')
    expect(screen.getByRole('link', { name: 'Pull Requests' })).toHaveAttribute(
      'href',
      '/code/repositories/repo-1/pull-requests'
    )
    expect(screen.getByRole('link', { name: 'Buscar' })).toHaveAttribute('href', '/code/repositories/repo-1/search')
    expect(screen.getByRole('link', { name: 'Configurações' })).toHaveAttribute(
      'href',
      '/code/repositories/repo-1/settings'
    )
  })

  it('marks the issues tab as active for nested issues paths', () => {
    mockPathname = '/code/repositories/repo-1/issues'
    render(<RepoTabBar repoId="repo-1" />)
    expect(screen.getByRole('link', { name: 'Alertas' })).toHaveAttribute('aria-current', 'page')
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
    expect(screen.getByRole('link', { name: 'Arquivos' })).not.toHaveAttribute('aria-current')
  })

  it('marks the search tab as active for any nested search path', () => {
    mockPathname = '/code/repositories/repo-1/search'
    render(<RepoTabBar repoId="repo-1" />)

    expect(screen.getByRole('link', { name: 'Buscar' })).toHaveAttribute('aria-current', 'page')
  })

  it('respects the activeTab override when the pathname is ambiguous', () => {
    mockPathname = '/code/repositories/repo-1/files?path=cmd/server/main.go'
    render(<RepoTabBar repoId="repo-1" activeTab="files" />)

    expect(screen.getByRole('link', { name: 'Arquivos' })).toHaveAttribute('aria-current', 'page')
  })
})
