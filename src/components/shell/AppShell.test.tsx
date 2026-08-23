import { fireEvent, render, screen } from '@testing-library/react'
import { AppShell } from './AppShell'
import { UserInfo } from '@/lib/types/auth'

// AppShell embeds the CommandPalette and the user menu, both of which use
// `useRouter`. Mocked here so component tests render without a real router.
const push = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
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

describe('AppShell header', () => {
  it('renders Code as the primary hub link', () => {
    render(
      <AppShell user={user} activeHub="code">
        <div>content</div>
      </AppShell>
    )

    expect(screen.queryByText('Início')).not.toBeInTheDocument()
    const codeHub = screen.getByRole('link', { name: 'Code' })
    expect(codeHub).toHaveAttribute('href', '/')
    expect(codeHub).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'idp.ai' })).toHaveAttribute('href', '/')
  })

  it('keeps unavailable hubs disabled instead of linking to missing pages', () => {
    render(
      <AppShell user={user} activeHub="code">
        <div>content</div>
      </AppShell>
    )

    expect(screen.queryByRole('link', { name: 'Infra' })).not.toBeInTheDocument()
    expect(screen.getByLabelText('Infra — Em breve')).toBeInTheDocument()
    expect(screen.getByLabelText('Deploys — Em breve')).toBeInTheDocument()
  })

  // Arquitetura shipped, so it must link rather than say "Em breve". A live
  // feature behind a greyed-out label is worse than no label: it tells people the
  // thing does not exist.
  it('links the Arquitetura hub now that the graph carries the domain', () => {
    render(
      <AppShell user={user} activeHub="arch">
        <div>content</div>
      </AppShell>
    )

    const archHub = screen.getByRole('link', { name: 'Arquitetura' })
    expect(archHub).toHaveAttribute('href', '/graph')
    expect(archHub).toHaveAttribute('aria-current', 'page')
    expect(screen.queryByLabelText('Arquitetura — Em breve')).not.toBeInTheDocument()
  })

  it('links organization settings from the header', () => {
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

  it('opens the user menu with the account actions', () => {
    render(
      <AppShell user={user} activeHub="code">
        <div>content</div>
      </AppShell>
    )

    fireEvent.click(screen.getByRole('button', { name: 'Menu do usuário' }))

    expect(screen.getByText('user@example.com · admin')).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Meu onboarding' })).toHaveAttribute(
      'href',
      '/onboarding'
    )
    expect(screen.getByRole('menuitem', { name: 'Sair' })).toBeInTheDocument()
  })

  it('offers switching organizations from the org chip', () => {
    render(
      <AppShell user={user} activeHub="code">
        <div>content</div>
      </AppShell>
    )

    fireEvent.click(screen.getByRole('button', { name: /^Org/ }))

    expect(screen.getByRole('menuitem', { name: 'Trocar de organização' })).toHaveAttribute(
      'href',
      '/select-organization'
    )
  })

  it('renders the page action slot next to the search field', () => {
    render(
      <AppShell user={user} activeHub="code" topRight={<button type="button">Novo repositório</button>}>
        <div>content</div>
      </AppShell>
    )

    expect(screen.getByRole('button', { name: 'Novo repositório' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Abrir paleta de comandos' })).toBeInTheDocument()
  })

  // Regression guard. The content wrapper is a flex item of a column, where an
  // `auto` cross-axis margin suppresses `align-items: stretch`. With
  // `margin: 0 auto` and no explicit width the box collapsed to shrink-to-fit,
  // so every page rendered as a narrow column instead of filling the 1400px
  // container the header already used — measured at 162px against the header's
  // 1400px. jsdom computes no layout, so this asserts the declaration that
  // prevents it.
  it('lets the content wrapper fill the container rather than shrink to its content', () => {
    render(
      <AppShell user={user} activeHub="code">
        <div data-testid="page">content</div>
      </AppShell>
    )

    const wrapper = screen.getByTestId('page').parentElement as HTMLElement
    expect(wrapper).toHaveStyle({ width: '100%', maxWidth: '1400px', margin: '0px auto' })
  })

  it('gives the header rows the same width as the content, so the two align', () => {
    const { container } = render(
      <AppShell user={user} activeHub="code">
        <div data-testid="page">content</div>
      </AppShell>
    )

    const headerRow = container.querySelector('header > div') as HTMLElement
    const wrapper = screen.getByTestId('page').parentElement as HTMLElement
    expect(headerRow).toHaveStyle({ maxWidth: '1400px', padding: '0px 28px' })
    expect(wrapper).toHaveStyle({ maxWidth: '1400px' })
  })
})
