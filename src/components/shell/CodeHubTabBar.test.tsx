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
    // The graph moved to the Arquitetura hub, so it must not also sit here — two
    // entry points to one page is how a nav starts lying about its structure.
    expect(screen.queryByRole('link', { name: 'Grafo' })).not.toBeInTheDocument()
    // AI code scaffolding is gone — the tab must not link to a dead route.
    expect(screen.queryByRole('link', { name: 'Templates' })).not.toBeInTheDocument()
  })
})
