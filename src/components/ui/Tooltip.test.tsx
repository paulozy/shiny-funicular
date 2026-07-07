import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Tooltip } from './Tooltip'

describe('Tooltip', () => {
  it('renders the trigger and hides content by default', () => {
    render(
      <Tooltip content={<span>Help content</span>} triggerLabel="help">
        trigger
      </Tooltip>,
    )
    expect(screen.getByRole('button', { name: 'help' })).toBeInTheDocument()
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('toggles content on click', () => {
    render(
      <Tooltip content={<span>Help content</span>} triggerLabel="help">
        trigger
      </Tooltip>,
    )
    const button = screen.getByRole('button', { name: 'help' })

    fireEvent.click(button)
    expect(screen.getByRole('tooltip')).toHaveTextContent('Help content')

    fireEvent.click(button)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('shows content on focus and hides on Escape', () => {
    render(
      <Tooltip content={<span>Help content</span>} triggerLabel="help">
        trigger
      </Tooltip>,
    )
    const button = screen.getByRole('button', { name: 'help' })

    fireEvent.focus(button)
    expect(screen.getByRole('tooltip')).toBeInTheDocument()

    fireEvent.keyDown(button, { key: 'Escape' })
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('shows content on mouse enter over the wrapper', () => {
    render(
      <Tooltip content={<span>Help content</span>} triggerLabel="help">
        trigger
      </Tooltip>,
    )
    const button = screen.getByRole('button', { name: 'help' })
    fireEvent.mouseEnter(button.parentElement!)
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
  })
})
