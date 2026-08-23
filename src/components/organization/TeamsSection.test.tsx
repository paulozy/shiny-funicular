import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TeamsSection } from './TeamsSection'
import { apiFetch } from '@/lib/api/client'

jest.mock('@/lib/api/client', () => ({ apiFetch: jest.fn() }))
const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>

const teams = {
  items: [
    {
      id: 'team-a',
      name: 'Plataforma',
      slug: 'plataforma',
      source: 'local' as const,
      member_count: 2,
      repository_count: 1,
      created_at: '2026-01-01T00:00:00Z',
    },
  ],
  total: 1,
}

const orgMembers = {
  items: [
    {
      user_id: 'u1',
      email: 'a@acme.com',
      full_name: 'Ana',
      role: 'developer' as const,
      is_active: true,
      joined_at: '2026-01-01T00:00:00Z',
    },
    {
      user_id: 'u2',
      email: 'b@acme.com',
      full_name: 'Bruno',
      role: 'developer' as const,
      is_active: true,
      joined_at: '2026-01-01T00:00:00Z',
    },
  ],
  total: 2,
}

// One repository owned by the team, one owned by nobody — the two cases the
// editor has to tell apart.
const repositories = {
  repositories: [
    {
      id: 'repo-1',
      name: 'paulozy/shiny-funicular',
      description: 'IDP Frontend',
      owner_team: { id: 'team-a', name: 'Plataforma', slug: 'plataforma' },
    },
    { id: 'repo-2', name: 'paulozy/cuddly-lamp', description: 'IDP Backend' },
  ],
  total: 2,
}

function mockLoad(teamMembers: unknown = { items: [], total: 0 }) {
  mockApiFetch.mockImplementation((url: string) => {
    if (/^\/api\/teams\/[^/]+\/members$/.test(url)) return Promise.resolve(teamMembers) as never
    if (url === '/api/teams') return Promise.resolve(teams) as never
    if (url === '/api/organizations/members') return Promise.resolve(orgMembers) as never
    if (url.startsWith('/api/repositories')) return Promise.resolve(repositories) as never
    return Promise.resolve(undefined) as never
  })
}

async function openEditor() {
  render(<TeamsSection />)
  fireEvent.click(await screen.findByRole('button', { name: 'Editar time' }))
  return screen.findByRole('dialog', { name: /Editar time Plataforma/i })
}

describe('TeamsSection', () => {
  beforeEach(() => mockApiFetch.mockReset())

  it('lists teams with their people and repository counts', async () => {
    mockLoad()
    render(<TeamsSection />)

    expect(await screen.findByText('Plataforma')).toBeInTheDocument()
    // The repository count is derived from ownership, not from the team
    // payload, so the list and the editor cannot disagree.
    expect(screen.getByText('2 pessoas · 1 repositório')).toBeInTheDocument()
  })

  it('creates a team', async () => {
    mockLoad()
    render(<TeamsSection />)
    await screen.findByText('Plataforma')

    fireEvent.change(screen.getByLabelText(/novo time/i), { target: { value: 'Pagamentos' } })
    // The API answers with the created team; the list sorts on its name.
    mockApiFetch.mockResolvedValueOnce({
      id: 'team-b',
      name: 'Pagamentos',
      slug: 'pagamentos',
      source: 'local',
      member_count: 0,
      repository_count: 0,
      created_at: '2026-01-01T00:00:00Z',
    } as never)
    fireEvent.click(screen.getByRole('button', { name: 'Criar time' }))

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith(
        '/api/teams',
        expect.objectContaining({ method: 'POST' })
      )
    })
  })

  it('guides the user when no team exists yet', async () => {
    mockApiFetch.mockImplementation((url: string) => {
      if (url === '/api/teams') return Promise.resolve({ items: [], total: 0 }) as never
      if (url.startsWith('/api/repositories')) return Promise.resolve({ repositories: [], total: 0 }) as never
      return Promise.resolve(orgMembers) as never
    })
    render(<TeamsSection />)

    expect(await screen.findByText(/Nenhum time ainda/)).toBeInTheDocument()
  })
})

describe('TeamEditModal, through the teams settings', () => {
  beforeEach(() => mockApiFetch.mockReset())

  it('shows the team members', async () => {
    mockLoad({ items: [{ user_id: 'u1', email: 'a@acme.com', full_name: 'Ana', role: 'lead' }], total: 1 })
    await openEditor()

    await waitFor(() => expect(mockApiFetch).toHaveBeenCalledWith('/api/teams/team-a/members'))
    expect(await screen.findByText('Ana')).toBeInTheDocument()
    expect(screen.getByText('lead')).toBeInTheDocument()
  })

  it('renames the team when the name field loses focus', async () => {
    mockLoad()
    await openEditor()

    const field = screen.getByLabelText(/nome do time/i)
    fireEvent.change(field, { target: { value: 'Plataforma Core' } })
    fireEvent.blur(field)

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith(
        '/api/teams/team-a',
        expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ name: 'Plataforma Core' }) })
      )
    })
  })

  it('does not call the API when the name is unchanged', async () => {
    mockLoad()
    await openEditor()

    fireEvent.blur(screen.getByLabelText(/nome do time/i))

    await waitFor(() => expect(mockApiFetch).toHaveBeenCalledWith('/api/teams/team-a/members'))
    expect(mockApiFetch).not.toHaveBeenCalledWith(
      '/api/teams/team-a',
      expect.objectContaining({ method: 'PATCH' })
    )
  })

  it('adds a person to the team', async () => {
    mockLoad()
    await openEditor()
    await waitFor(() => expect(mockApiFetch).toHaveBeenCalledWith('/api/teams/team-a/members'))

    await userEvent.selectOptions(screen.getByLabelText(/adicionar pessoa ao time/i), 'u2')

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith(
        '/api/teams/team-a/members',
        expect.objectContaining({ method: 'POST', body: JSON.stringify({ user_id: 'u2' }) })
      )
    })
  })

  it('lists only the repositories the team owns', async () => {
    mockLoad()
    await openEditor()

    expect(await screen.findByText('paulozy/shiny-funicular')).toBeInTheDocument()
    // The unowned one belongs in the picker, not in the owned list.
    expect(screen.getByRole('option', { name: /cuddly-lamp — sem dono/ })).toBeInTheDocument()
  })

  // Ownership is written through the repository, because a repository has a
  // single owning team — the same call the repository settings page makes.
  it('attaches a repository by assigning this team as its owner', async () => {
    mockLoad()
    await openEditor()
    await screen.findByText('paulozy/shiny-funicular')

    await userEvent.selectOptions(screen.getByLabelText(/atribuir reposit/i), 'repo-2')

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith(
        '/api/repositories/repo-2/owner',
        expect.objectContaining({ method: 'PUT', body: JSON.stringify({ team_id: 'team-a' }) })
      )
    })
  })

  // Detaching clears the owner rather than deleting anything — "unowned" is a
  // real state the catalog reports.
  it('detaches a repository by clearing its owner', async () => {
    mockLoad()
    await openEditor()

    const row = (await screen.findByText('paulozy/shiny-funicular')).closest('div') as HTMLElement
    fireEvent.click(within(row).getByRole('button', { name: 'Remover' }))

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith(
        '/api/repositories/repo-1/owner',
        expect.objectContaining({ method: 'PUT', body: JSON.stringify({ team_id: null }) })
      )
    })
  })

  it('closes on Escape', async () => {
    mockLoad()
    const dialog = await openEditor()

    fireEvent.keyDown(window, { key: 'Escape' })

    await waitFor(() => expect(dialog).not.toBeInTheDocument())
  })
})
