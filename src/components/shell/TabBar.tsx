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

export type TabBarVariant = 'subtle' | 'prominent'

interface TabBarProps {
  items: TabBarItem[]
  /** Render the tab bar without the bottom hairline border (e.g. when the parent already draws one). */
  flush?: boolean
  ariaLabel?: string
  /**
   * Visual density. `subtle` (default) is the original hairline-underline look
   * used by `CodeHubTabBar`. `prominent` gives the active tab a surface fill
   * and larger touch targets — intended for the repository sub-navigation,
   * which kept getting lost just below the app's main topbar.
   */
  variant?: TabBarVariant
  /** Merged into the container — used by the shell to seat the row in the header. */
  style?: CSSProperties
}

export function TabBar({
  items,
  flush = false,
  ariaLabel = 'Navegação por seções',
  variant = 'subtle',
  style,
}: TabBarProps) {
  const pathname = usePathname() ?? ''
  const prominent = variant === 'prominent'

  // v3 draws both tab rows the same way — a text label with a 2px accent
  // underline. `prominent` only differs by the hairline the row sits on and a
  // little more breathing room, matching the repository sub-navigation in the
  // mockup.
  const containerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: prominent ? 22 : 20,
    flexWrap: 'wrap',
    overflowX: 'auto',
    overflowY: 'hidden',
    borderBottom: flush ? 'none' : `1px solid ${T.border}`,
    padding: 0,
    marginBottom: prominent ? 22 : 18,
    background: 'transparent',
    ...style,
  }

  const itemBaseStyle = (active: boolean, disabled: boolean): CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: prominent ? '0 0 10px' : '0 0 8px',
    fontSize: 14,
    fontWeight: active ? 600 : 500,
    color: disabled ? T.neutral500 : active ? T.ink : T.faint,
    textDecoration: 'none',
    cursor: disabled ? 'default' : 'pointer',
    borderBottom: `2px solid ${active ? T.accent : 'transparent'}`,
    marginBottom: -1,
    whiteSpace: 'nowrap',
    background: 'none',
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
