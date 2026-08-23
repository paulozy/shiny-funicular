import { fireEvent, render, screen } from '@testing-library/react'
import { ScopeFilter } from './ScopeFilter'

const push = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  usePathname: () => '/',
}))

describe('ScopeFilter', () => {
  beforeEach(() => push.mockClear())

  it('reflects the scope it was given', () => {
    render(<ScopeFilter scope="mine" />)
    expect(screen.getByRole('radio', { name: 'Meus times' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Toda a organização' })).not.toBeChecked()
  })

  // The scope lives in the URL so the server can narrow the catalog before it
  // picks which repositories to ask for pull requests — filtering in the
  // browser would filter after that cap.
  it('navigates when the viewer scopes to their teams', () => {
    render(<ScopeFilter scope="all" />)

    fireEvent.click(screen.getByRole('radio', { name: 'Meus times' }))

    expect(push).toHaveBeenCalledWith('/?scope=mine')
  })

  // Always explicit, never "absent means default": the default depends on the
  // viewer's role, so a bare `/` would show a shared link's recipient something
  // other than what the sender saw.
  it('writes the scope explicitly when going back to the whole organization', () => {
    render(<ScopeFilter scope="mine" />)

    fireEvent.click(screen.getByRole('radio', { name: 'Toda a organização' }))

    expect(push).toHaveBeenCalledWith('/?scope=all')
  })
})

it('lists the narrowest scope first', () => {
  render(<ScopeFilter scope="mine" />)
  const labels = screen.getAllByRole('radio').map((r) => (r as HTMLInputElement).value)
  expect(labels).toEqual(['mine', 'all'])
})
