'use client'

import { CSSProperties } from 'react'
import Link from 'next/link'
import { T } from '@/lib/tokens'

interface DocsScopeTabsProps {
  active: 'org' | 'repo'
}

/**
 * Top-of-page tab bar that switches between the Org-wide and per-Repo docs
 * views. Implemented as plain `<Link>` items so server navigation preserves
 * the SSR data prefetch (the page itself reads `?scope` to dispatch).
 */
export function DocsScopeTabs({ active }: DocsScopeTabsProps) {
  const containerStyle: CSSProperties = {
    display: 'flex',
    gap: 4,
    padding: '8px 24px 0',
    borderBottom: `1px solid ${T.border}`,
    background: T.surface,
  }

  const tabStyle = (current: boolean): CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 14px',
    fontSize: 12.5,
    fontWeight: current ? 600 : 500,
    color: current ? T.ink : T.ink3,
    textDecoration: 'none',
    borderBottom: `2px solid ${current ? T.accent : 'transparent'}`,
    marginBottom: -1,
  })

  return (
    <nav aria-label="Escopo da documentação" style={containerStyle}>
      <Link
        href="/docs?scope=org"
        style={tabStyle(active === 'org')}
        aria-current={active === 'org' ? 'page' : undefined}
      >
        Organização
      </Link>
      <Link
        href="/docs"
        style={tabStyle(active === 'repo')}
        aria-current={active === 'repo' ? 'page' : undefined}
      >
        Repositório
      </Link>
    </nav>
  )
}
