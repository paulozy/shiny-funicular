import { render, screen, waitFor, fireEvent } from '@testing-library/react'
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
      repository_count: 3,
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
  ],
  total: 1,
}

function mockLoad(teamMembers: unknown = { items: [], total: 0 }) {
  mockApiFetch.mockImplementation((url: string) => {
    if (/^\/api\/teams\/[^/]+\/members$/.test(url)) return Promise.resolve(teamMembers) as never
    if (url === '/api/teams') return Promise.resolve(teams) as never
    if (url === '/api/organizations/members') return Promise.resolve(orgMembers) as never
    return Promise.resolve(undefined) as never
  })
}

describe('TeamsSection', () => {
  beforeEach(() => mockApiFetch.mockReset())

  it('lists teams with member and repository counts', async () => {
    mockLoad()
    render(<TeamsSection />)

    expect(await screen.findByText('Plataforma')).toBeInTheDocument()
    expect(screen.getByText('2 pessoa(s)')).toBeInTheDocument()
    expect(screen.getByText('3 repo(s)')).toBeInTheDocument()
  })

  it('expands a team to show its members', async () => {
    mockLoad({ items: [{ user_id: 'u1', email: 'a@acme.com', full_name: 'Ana', role: 'lead' }], total: 1 })
    render(<TeamsSection />)

    fireEvent.click(await screen.findByRole('button', { name: /plataforma/i }))

    // Expanding fetches the members, so wait on the request settling before
    // asserting on what it rendered — same pattern as CoverageTokensSection.
    await waitFor(() => expect(mockApiFetch).toHaveBeenCalledWith('/api/teams/team-a/members'))

    expect(await screen.findByText('Ana')).toBeInTheDocument()
    expect(screen.getByText('lead')).toBeInTheDocument()
  })

  it('creates a team', async () => {
    mockLoad()
    render(<TeamsSection />)
    await screen.findByText('Plataforma')

    fireEvent.change(screen.getByLabelText(/novo time/i), { target: { value: 'Pagamentos' } })
    mockApiFetch.mockResolvedValueOnce({
      id: 'team-b',
      name: 'Pagamentos',
      slug: 'pagamentos',
      source: 'local',
      member_count: 1,
      repository_count: 0,
      created_at: '2026-01-01T00:00:00Z',
    } as never)
    fireEvent.click(screen.getByRole('button', { name: /^criar$/i }))

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith('/api/teams', expect.objectContaining({ method: 'POST' }))
    })
  })

  it('guides the user when no team exists yet', async () => {
    mockApiFetch.mockImplementation((url: string) => {
      if (url === '/api/teams') return Promise.resolve({ items: [], total: 0 }) as never
      return Promise.resolve(orgMembers) as never
    })
    render(<TeamsSection />)

    expect(await screen.findByText(/Nenhum time ainda/)).toBeInTheDocument()
  })
})
