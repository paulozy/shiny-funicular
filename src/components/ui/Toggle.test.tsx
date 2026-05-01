import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Toggle } from './Toggle'

describe('Toggle', () => {
  it('renders a toggle button', () => {
    const { container } = render(<Toggle checked={false} onChange={() => {}} />)
    expect(container.querySelector('button')).toBeInTheDocument()
  })

  it('calls onChange when toggled', () => {
    const onChange = jest.fn()
    const { container } = render(<Toggle checked={false} onChange={onChange} />)
    const button = container.querySelector('button')!
    fireEvent.click(button)
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('displays label when provided', () => {
    render(<Toggle checked={false} onChange={() => {}} label="Enable feature" />)
    expect(screen.getByText('Enable feature')).toBeInTheDocument()
  })

  it('disables the toggle when disabled prop is true', () => {
    const onChange = jest.fn()
    const { container } = render(<Toggle checked={false} onChange={onChange} disabled={true} />)
    const button = container.querySelector('button')!
    fireEvent.click(button)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('reflects checked state', () => {
    const { container, rerender } = render(<Toggle checked={false} onChange={() => {}} />)
    let button = container.querySelector('button')!
    expect(button).toHaveAttribute('aria-pressed', 'false')

    rerender(<Toggle checked={true} onChange={() => {}} />)
    button = container.querySelector('button')!
    expect(button).toHaveAttribute('aria-pressed', 'true')
  })
})
