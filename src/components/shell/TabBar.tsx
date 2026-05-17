'use client'

import { CSSProperties, ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { T } from '@/lib/tokens'

export interface TabBarItem {
  /** Display label */
  label: string
  /** Destination route. Omit for disabled (placeholder) tabs. */
  href?: string
  /** Optional adornment (icon/badge) rendered before the label. */
  leading?: ReactNode
  /** Tooltip override. Default for disabled tabs is "Em breve". */
  title?: string
  /**
   * When provided, forces this tab as active regardless of the current path.
   * Useful for routes that share a base path but mean different things.
   */
  forceActive?: boolean
  /**
   * When provided, the tab is considered active only if pathname starts with
   * this value. Defaults to exact match against `href`.
   */
  matchPrefix?: string
}

interface TabBarProps {
  items: TabBarItem[]
  /** Render the tab bar without the bottom hairline border (e.g. when the parent already draws one). */
  flush?: boolean
  ariaLabel?: string
}

export function TabBar({ items, flush = false, ariaLabel = 'Navegação por seções' }: TabBarProps) {
  const pathname = usePathname() ?? ''

  const containerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'stretch',
    gap: 4,
    overflowX: 'auto',
    overflowY: 'hidden',
    borderBottom: flush ? 'none' : `1px solid ${T.border}`,
    padding: '0 18px',
  }

  const itemBaseStyle = (active: boolean, disabled: boolean): CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '10px 12px 9px',
    fontSize: 12.5,
    fontWeight: active ? 600 : 500,
    color: disabled ? T.faint : active ? T.ink : T.ink2,
    textDecoration: 'none',
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.7 : 1,
    borderBottom: `2px solid ${active ? T.accent : 'transparent'}`,
    marginBottom: -1,
    whiteSpace: 'nowrap',
  })

  return (
    <nav role="navigation" aria-label={ariaLabel} style={containerStyle}>
      {items.map((item) => {
        const disabled = !item.href
        const active = item.forceActive
          ? true
          : item.href
            ? item.matchPrefix
              ? pathname.startsWith(item.matchPrefix)
              : pathname === item.href
            : false
        const title = item.title ?? (disabled ? 'Em breve' : undefined)

        if (item.href) {
          return (
            <Link
              key={item.label}
              href={item.href}
              style={itemBaseStyle(active, false)}
              aria-current={active ? 'page' : undefined}
              title={title}
            >
              {item.leading}
              {item.label}
            </Link>
          )
        }

        return (
          <span
            key={item.label}
            aria-disabled="true"
            title={title}
            style={itemBaseStyle(false, true)}
          >
            {item.leading}
            {item.label}
          </span>
        )
      })}
    </nav>
  )
}
