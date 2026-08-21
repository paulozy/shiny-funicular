import { render, screen } from '@testing-library/react'
import { CodeHubTabBar } from './CodeHubTabBar'

jest.mock('next/navigation', () => ({
  usePathname: () => '/',
}))

describe('CodeHubTabBar', () => {
  it('renders the Code Hub tabs as real links', () => {
    render(<CodeHubTabBar />)

    const reposTab = screen.getByRole('link', { name: 'Repositórios' })
    expect(reposTab).toHaveAttribute('href', '/')
    expect(reposTab).toHaveAttribute('aria-current', 'page')

    expect(screen.getByRole('link', { name: 'Documentação' })).toHaveAttribute('href', '/docs')
    expect(screen.getByRole('link', { name: 'Grafo' })).toHaveAttribute('href', '/graph')
    // AI code scaffolding is gone — the tab must not link to a dead route.
    expect(screen.queryByRole('link', { name: 'Templates' })).not.toBeInTheDocument()
  })
})
