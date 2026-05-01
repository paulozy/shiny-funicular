import { fireEvent, render, screen } from '@testing-library/react'
import { AppShell } from './AppShell'
import { UserInfo } from '@/lib/types/auth'

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
})
