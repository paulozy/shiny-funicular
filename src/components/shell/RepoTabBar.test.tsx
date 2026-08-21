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
    expect(screen.getByRole('link', { name: 'Pull Requests' })).toHaveAttribute(
      'href',
      '/code/repositories/repo-1/pull-requests'
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
    expect(screen.getByRole('link', { name: 'Pull Requests' })).toHaveAttribute('aria-current', 'page')
  })

  it('marks the overview tab as active on the repository root path', () => {
    mockPathname = '/code/repositories/repo-1'
    render(<RepoTabBar repoId="repo-1" />)

    expect(screen.getByRole('link', { name: 'Visão geral' })).toHaveAttribute('aria-current', 'page')
  })

  it('respects the activeTab override when the pathname is ambiguous', () => {
    mockPathname = '/code/repositories/repo-1/pull-requests/42'
    render(<RepoTabBar repoId="repo-1" activeTab="pull-requests" />)

    expect(screen.getByRole('link', { name: 'Pull Requests' })).toHaveAttribute('aria-current', 'page')
  })
})
