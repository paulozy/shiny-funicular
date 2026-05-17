import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { CommandPalette } from './CommandPalette'

const push = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}))

describe('CommandPalette', () => {
  beforeEach(() => {
    push.mockClear()
    ;(global.fetch as jest.Mock | undefined)?.mockClear?.()
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          repositories: [
            {
              id: 'repo-1',
              name: 'web',
              full_name: 'org/web',
              provider: 'github',
              url: 'https://github.com/org/web',
              is_private: false,
              organization_id: 'org-1',
              created_at: '2026-01-01T00:00:00Z',
              updated_at: '2026-01-01T00:00:00Z',
            },
          ],
          total: 1,
          limit: 100,
          offset: 0,
        }),
    }) as unknown as typeof fetch
  })

  it('renders nothing when closed', () => {
    render(<CommandPalette open={false} onClose={() => undefined} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders the dialog and core navigation items when open', async () => {
    render(<CommandPalette open onClose={() => undefined} />)

    expect(screen.getByRole('dialog', { name: 'Paleta de comandos' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Buscar rotas, repositórios e ações…')).toBeInTheDocument()

    // The Code Hub and Settings options come from the static "Navegar" group.
    expect(screen.getByText('Code Hub')).toBeInTheDocument()
    expect(screen.getByText('Configurações da organização')).toBeInTheDocument()

    // Repositories are fetched lazily. Wait until the mocked one appears.
    await waitFor(() => {
      expect(screen.getByText('web')).toBeInTheDocument()
    })
  })

  it('navigates and closes when a navigation entry is selected', async () => {
    const onClose = jest.fn()
    render(<CommandPalette open onClose={onClose} />)

    fireEvent.click(screen.getByText('Code Hub'))

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(push).toHaveBeenCalledWith('/')
  })

  it('runs the action onSelect and closes when an action entry is selected', () => {
    const onClose = jest.fn()
    const onSelect = jest.fn()
    render(
      <CommandPalette
        open
        onClose={onClose}
        actions={[{ id: 'theme', label: 'Trocar tema', onSelect }]}
      />
    )

    fireEvent.click(screen.getByText('Trocar tema'))

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('closes when pressing Escape', () => {
    const onClose = jest.fn()
    render(<CommandPalette open onClose={onClose} />)

    fireEvent.keyDown(window, { key: 'Escape' })

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
