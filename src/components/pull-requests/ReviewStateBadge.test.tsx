import { render, screen } from '@testing-library/react'
import { ReviewStateBadge } from './ReviewStateBadge'

describe('ReviewStateBadge', () => {
  it('shows who approved', () => {
    render(<ReviewStateBadge decision="approved" approvedBy={['julia.r']} />)
    expect(screen.getByText(/Aprovado/)).toBeInTheDocument()
    expect(screen.getByText(/@julia\.r/)).toBeInTheDocument()
  })

  it('shows an outstanding objection', () => {
    render(<ReviewStateBadge decision="changes_requested" changesRequestedBy={['caio']} />)
    expect(screen.getByText(/Mudanças solicitadas/)).toBeInTheDocument()
    expect(screen.getByText(/@caio/)).toBeInTheDocument()
  })

  it('drops the names in compact mode', () => {
    render(<ReviewStateBadge decision="approved" approvedBy={['julia.r']} compact />)
    expect(screen.getByText(/Aprovado/)).toBeInTheDocument()
    expect(screen.queryByText(/@julia\.r/)).not.toBeInTheDocument()
  })

  // The two blank cases, for different reasons: no verdict is unremarkable,
  // and an unknown verdict must never be rendered as "not reviewed".
  it('renders nothing when nobody has reviewed', () => {
    const { container } = render(<ReviewStateBadge decision="" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when the verdict is unknown', () => {
    expect(render(<ReviewStateBadge decision={null} />).container).toBeEmptyDOMElement()
    expect(render(<ReviewStateBadge />).container).toBeEmptyDOMElement()
  })
})
