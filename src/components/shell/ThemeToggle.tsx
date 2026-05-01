'use client'

import { CSSProperties, useEffect, useState } from 'react'
import { T } from '@/lib/tokens'
import { MFIcon } from '@/components/icons/MFIcon'

type Theme = 'light' | 'dark'

function currentTheme(): Theme {
  if (typeof document === 'undefined') return 'light'
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    setTheme(currentTheme())
  }, [])

  const nextTheme = theme === 'dark' ? 'light' : 'dark'

  const toggle = () => {
    document.documentElement.dataset.theme = nextTheme
    localStorage.setItem('idp-theme', nextTheme)
    setTheme(nextTheme)
  }

  const buttonStyle: CSSProperties = {
    width: 28,
    height: 28,
    borderRadius: 6,
    border: `1px solid ${T.border}`,
    background: T.surface,
    color: T.ink3,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  }

  return (
    <button
      type="button"
      aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
      title={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
      onClick={toggle}
      style={buttonStyle}
    >
      <MFIcon name={theme === 'dark' ? 'sun' : 'moon'} size={14} color={T.ink3} />
    </button>
  )
}
