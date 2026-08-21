import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MembersSection } from './MembersSection'
import { UserInfo } from '@/lib/types/auth'
import { apiFetch } from '@/lib/api/client'

jest.mock('@/lib/api/client', () => ({
  apiFetch: jest.fn(),
}))

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>

const admin: UserInfo = {
  id: 'u-admin',
  email: 'admin@acme.com',
  full_name: 'Ada Admin',
  role: 'admin',
  organization: { id: 'org-1', name: 'Acme', slug: 'acme', role: 'admin' },
}

const members = {
  items: [
    {
      user_id: 'u-admin',
      email: 'admin@acme.com',
      full_name: 'Ada Admin',
      role: 'admin' as const,
      is_active: true,
      joined_at: '2026-01-01T00:00:00Z',
    },
    {
      user_id: 'u-dev',
      email: 'dev@acme.com',
      full_name: 'Dev Person',
      role: 'developer' as const,
      is_active: true,
      joined_at: '2026-02-01T00:00:00Z',
    },
  ],
  total: 2,
}

const invites = {
  items: [
    {
      id: 'inv-1',
      email: 'pending@acme.com',
      role: 'viewer' as const,
      status: 'pending' as const,
      expires_at: '2030-01-01T00:00:00Z',
      created_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 'inv-2',
      email: 'done@acme.com',
      role: 'developer' as const,
      status: 'accepted' as const,
      expires_at: '2030-01-01T00:00:00Z',
      created_at: '2026-01-01T00:00:00Z',
    },
  ],
  total: 2,
}

function mockLoad() {
  mockApiFetch.mockImplementation((url: string) => {
    if (url.includes('/members')) return Promise.resolve(members) as never
    if (url.includes('/invites')) return Promise.resolve(invites) as never
    return Promise.resolve(undefined) as never
  })
}

describe('MembersSection', () => {
  beforeEach(() => mockApiFetch.mockReset())

  it('lists members with their roles', async () => {
    mockLoad()
    render(<MembersSection user={admin} />)

    expect(await screen.findByText('Ada Admin')).toBeInTheDocument()
    expect(screen.getByText('dev@acme.com')).toBeInTheDocument()
  })

  // Changing your own role is how an org loses its last admin by accident, and
  // the API refuses it — so the control must not be offered.
  it('does not offer a role select or remove button for yourself', async () => {
    mockLoad()
    render(<MembersSection user={admin} />)

    await screen.findByText('Ada Admin')
    expect(screen.queryByLabelText('Papel de Ada Admin')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Papel de Dev Person')).toBeInTheDocument()
    // one Remover button — for the other member only
    expect(screen.getAllByRole('button', { name: /remover/i })).toHaveLength(1)
  })

  it('shows only pending invites', async () => {
    mockLoad()
    render(<MembersSection user={admin} />)

    expect(await screen.findByText('pending@acme.com')).toBeInTheDocument()
    expect(screen.queryByText('done@acme.com')).not.toBeInTheDocument()
  })

  it('patches the role when it is changed', async () => {
    mockLoad()
    render(<MembersSection user={admin} />)

    const select = await screen.findByLabelText('Papel de Dev Person')
    fireEvent.change(select, { target: { value: 'maintainer' } })

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith(
        '/api/organizations/members/u-dev',
        expect.objectContaining({ method: 'PATCH' })
      )
    })
  })

  it('surfaces a load failure instead of rendering an empty table silently', async () => {
    mockApiFetch.mockRejectedValue(new Error('backend fora do ar'))
    render(<MembersSection user={admin} />)

    expect(await screen.findByText(/backend fora do ar/)).toBeInTheDocument()
  })
})
