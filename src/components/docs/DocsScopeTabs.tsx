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
  // Drawn as the design system's segmented control, but built from links so a
  // scope switch is a real navigation the browser can prefetch and restore.
  const containerStyle: CSSProperties = {
    display: 'inline-flex',
    overflow: 'hidden',
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.button,
    background: T.surface,
  }

  const tabStyle = (current: boolean, first: boolean): CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 12px',
    fontSize: 13,
    color: current ? T.inkInverse : T.ink,
    background: current ? T.accent : 'transparent',
    textDecoration: 'none',
    borderLeft: first ? 'none' : `1px solid ${T.border}`,
  })

  return (
    <nav aria-label="Escopo da documentação" style={containerStyle}>
      <Link
        href="/docs?scope=org"
        style={tabStyle(active === 'org', true)}
        aria-current={active === 'org' ? 'page' : undefined}
      >
        Organização
      </Link>
      <Link
        href="/docs"
        style={tabStyle(active === 'repo', false)}
        aria-current={active === 'repo' ? 'page' : undefined}
      >
        Repositório
      </Link>
    </nav>
  )
}
