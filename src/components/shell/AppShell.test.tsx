import { fireEvent, render, screen } from '@testing-library/react'
import { AppShell } from './AppShell'
import { UserInfo } from '@/lib/types/auth'

// AppShell now embeds the CommandPalette, which relies on `useRouter` from
// Next.js navigation. We mock it here so component tests can render without a
// real router context.
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

beforeAll(() => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ repositories: [], total: 0, limit: 100, offset: 0 }),
  }) as unknown as typeof fetch
})

const user: UserInfo = {
  id: 'user-1',
  email: 'user@example.com',
  full_name: 'User One',
  role: 'admin',
  organization: {
    id: 'org-1',
    name: 'Org',
    slug: 'org',
    role: 'admin',
  },
}

describe('AppShell sidebar', () => {
  it('renders Code as the primary hub link and removes Início', () => {
    render(
      <AppShell user={user} activeHub="code">
        <div>content</div>
      </AppShell>
    )

    expect(screen.queryByText('Início')).not.toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Code' }).some((link) => link.getAttribute('href') === '/')).toBe(true)
    expect(screen.getByRole('link', { name: 'idp.ai' })).toHaveAttribute('href', '/')
  })

  it('keeps unavailable hubs disabled instead of linking to missing pages', () => {
    render(
      <AppShell user={user} activeHub="code">
        <div>content</div>
      </AppShell>
    )

    expect(screen.queryByRole('link', { name: 'Infra' })).not.toBeInTheDocument()
    expect(screen.getByText('Infra').closest('[aria-disabled="true"]')).toBeInTheDocument()
    expect(screen.getByText('Arquitetura').closest('[aria-disabled="true"]')).toBeInTheDocument()
  })

  it('links organization settings from the footer', () => {
    render(
      <AppShell user={user} activeHub="settings">
        <div>content</div>
      </AppShell>
    )

    expect(screen.getByRole('link', { name: 'Configurações da organização' })).toHaveAttribute(
      'href',
      '/settings'
    )
  })

  it('renders clickable breadcrumb ancestors and keeps the current item as text', () => {
    render(
      <AppShell
        user={user}
        activeHub="code"
        breadcrumb={[{ label: 'Code', href: '/' }, { label: 'web', href: '/code/repositories/repo-1' }, { label: 'busca' }]}
      >
        <div>content</div>
      </AppShell>
    )

    expect(screen.getAllByRole('link', { name: 'Code' }).some((link) => link.getAttribute('href') === '/')).toBe(true)
    expect(screen.getByRole('link', { name: 'web' })).toHaveAttribute('href', '/code/repositories/repo-1')
    expect(screen.getByText('busca').closest('a')).toBeNull()
  })

  it('can collapse and expand the AI panel', () => {
    render(
      <AppShell user={user} activeHub="code" aiPanel={<div>AI content</div>}>
        <div>content</div>
      </AppShell>
    )

    expect(screen.getByText('AI content')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /recolher co-pensador/i }))
    expect(screen.queryByText('AI content')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /expandir co-pensador/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /expandir co-pensador/i }))
    expect(screen.getByText('AI content')).toBeInTheDocument()
  })

  describe('collapsible sidebar', () => {
    beforeEach(() => {
      window.localStorage.clear()
      delete document.documentElement.dataset.sidebarMode
    })

    it('starts expanded by default and toggles to collapsed via the toggle button', () => {
      render(
        <AppShell user={user} activeHub="code">
          <div>content</div>
        </AppShell>
      )

      const sidebar = screen.getByRole('complementary', { name: 'Navegação principal' })
      expect(sidebar).toHaveAttribute('data-sidebar-mode', 'expanded')
      expect(screen.getByRole('link', { name: 'idp.ai' })).toBeInTheDocument()

      const toggle = screen.getByRole('button', { name: /recolher menu lateral/i })
      fireEvent.click(toggle)

      expect(sidebar).toHaveAttribute('data-sidebar-mode', 'collapsed')
      // When collapsed, the textual logo link is hidden — only the icons remain.
      expect(screen.queryByRole('link', { name: 'idp.ai' })).not.toBeInTheDocument()
      expect(window.localStorage.getItem('idp-sidebar-mode')).toBe('collapsed')
    })

    it('toggles via the Ctrl/Cmd+B keyboard shortcut', () => {
      render(
        <AppShell user={user} activeHub="code">
          <div>content</div>
        </AppShell>
      )

      const sidebar = screen.getByRole('complementary', { name: 'Navegação principal' })
      expect(sidebar).toHaveAttribute('data-sidebar-mode', 'expanded')

      fireEvent.keyDown(window, { key: 'b', ctrlKey: true })
      expect(sidebar).toHaveAttribute('data-sidebar-mode', 'collapsed')

      fireEvent.keyDown(window, { key: 'b', ctrlKey: true })
      expect(sidebar).toHaveAttribute('data-sidebar-mode', 'expanded')
    })

    it('respects the initial sidebar mode read from the document dataset', () => {
      document.documentElement.dataset.sidebarMode = 'collapsed'

      render(
        <AppShell user={user} activeHub="code">
          <div>content</div>
        </AppShell>
      )

      const sidebar = screen.getByRole('complementary', { name: 'Navegação principal' })
      expect(sidebar).toHaveAttribute('data-sidebar-mode', 'collapsed')
      // The expand toggle button is present (label flips to "expandir").
      expect(screen.getByRole('button', { name: /expandir menu lateral/i })).toBeInTheDocument()
    })

    it('keeps hub icons accessible while collapsed via aria-label', () => {
      document.documentElement.dataset.sidebarMode = 'collapsed'

      render(
        <AppShell user={user} activeHub="code">
          <div>content</div>
        </AppShell>
      )

      // Code hub is the only enabled hub today — its link still exposes the label.
      expect(screen.getByRole('link', { name: 'Code' })).toBeInTheDocument()
      // Disabled hubs keep their aria-label too, with "Em breve" suffix.
      expect(screen.getByLabelText('Infra — Em breve')).toBeInTheDocument()
    })
  })
})
