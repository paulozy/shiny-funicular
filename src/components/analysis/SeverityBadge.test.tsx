import { render, screen } from '@testing-library/react'
import { SeverityBadge } from './SeverityBadge'

describe('SeverityBadge', () => {
  it('renders the Portuguese label for each severity', () => {
    const { rerender } = render(<SeverityBadge severity="critical" />)
    expect(screen.getByRole('status')).toHaveTextContent('Crítico')

    rerender(<SeverityBadge severity="error" />)
    expect(screen.getByRole('status')).toHaveTextContent('Erro')

    rerender(<SeverityBadge severity="warning" />)
    expect(screen.getByRole('status')).toHaveTextContent('Aviso')

    rerender(<SeverityBadge severity="info" />)
    expect(screen.getByRole('status')).toHaveTextContent('Info')
  })

  it('exposes the severity via aria-label', () => {
    render(<SeverityBadge severity="critical" />)
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Severidade: Crítico')
  })

  it('omits the dot in compact size', () => {
    const { container } = render(<SeverityBadge severity="warning" size="compact" />)
    // compact has only the label text, no leading dot span as first child
    const status = container.querySelector('[role="status"]')
    expect(status?.children.length).toBe(0)
  })
})
