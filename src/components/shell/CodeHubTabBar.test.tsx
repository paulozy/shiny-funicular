import { render, screen } from '@testing-library/react'
import { CodeHubTabBar } from './CodeHubTabBar'

jest.mock('next/navigation', () => ({
  usePathname: () => '/',
}))

describe('CodeHubTabBar', () => {
  it('renders the Repositórios tab as active link and Templates as a real link, with Docs/Grafo as placeholders', () => {
    render(<CodeHubTabBar />)

    const reposTab = screen.getByRole('link', { name: 'Repositórios' })
    expect(reposTab).toHaveAttribute('href', '/')
    expect(reposTab).toHaveAttribute('aria-current', 'page')

    const templatesTab = screen.getByRole('link', { name: 'Templates' })
    expect(templatesTab).toHaveAttribute('href', '/templates')

    // The remaining future tabs render as non-links with aria-disabled="true"
    // and the "Em breve" tooltip until their routes ship.
    for (const label of ['Documentação', 'Grafo']) {
      const placeholder = screen.getByText(label)
      expect(placeholder).toHaveAttribute('aria-disabled', 'true')
      expect(placeholder).toHaveAttribute('title', 'Em breve')
    }
  })
})
