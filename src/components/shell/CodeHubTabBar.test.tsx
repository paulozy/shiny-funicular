import { render, screen } from '@testing-library/react'
import { CodeHubTabBar } from './CodeHubTabBar'

jest.mock('next/navigation', () => ({
  usePathname: () => '/',
}))

describe('CodeHubTabBar', () => {
  it('renders Repositórios/Templates/Documentação as real links and Grafo as placeholder', () => {
    render(<CodeHubTabBar />)

    const reposTab = screen.getByRole('link', { name: 'Repositórios' })
    expect(reposTab).toHaveAttribute('href', '/')
    expect(reposTab).toHaveAttribute('aria-current', 'page')

    expect(screen.getByRole('link', { name: 'Templates' })).toHaveAttribute('href', '/templates')
    expect(screen.getByRole('link', { name: 'Documentação' })).toHaveAttribute('href', '/docs')

    // Grafo is still a placeholder.
    const grafoTab = screen.getByText('Grafo')
    expect(grafoTab).toHaveAttribute('aria-disabled', 'true')
    expect(grafoTab).toHaveAttribute('title', 'Em breve')
  })
})
