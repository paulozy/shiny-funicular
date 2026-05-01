import { render, screen } from '@testing-library/react'
import { Input } from './Input'

describe('Input', () => {
  it('connects label and input with a stable generated id', () => {
    render(<Input label="Nome" value="" onChange={() => {}} />)

    const input = screen.getByLabelText('Nome')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('id')
    expect(input.id).not.toContain('Math.random')
  })

  it('honors an explicit id', () => {
    render(<Input id="custom-id" label="E-mail" value="" onChange={() => {}} />)

    expect(screen.getByLabelText('E-mail')).toHaveAttribute('id', 'custom-id')
  })
})
