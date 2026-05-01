import { fireEvent, render, screen } from '@testing-library/react'
import { ThemeToggle } from './ThemeToggle'

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.dataset.theme = 'light'
  })

  afterEach(() => {
    localStorage.clear()
    delete document.documentElement.dataset.theme
  })

  it('switches to dark mode and persists the choice', () => {
    render(<ThemeToggle />)

    fireEvent.click(screen.getByRole('button', { name: 'Ativar tema escuro' }))

    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem('idp-theme')).toBe('dark')
  })

  it('switches back to light mode from an existing dark theme', () => {
    document.documentElement.dataset.theme = 'dark'
    render(<ThemeToggle />)

    fireEvent.click(screen.getByRole('button', { name: 'Ativar tema claro' }))

    expect(document.documentElement.dataset.theme).toBe('light')
    expect(localStorage.getItem('idp-theme')).toBe('light')
  })
})
