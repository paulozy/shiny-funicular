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
}

export function TabBar({
  items,
  flush = false,
  ariaLabel = 'Navegação por seções',
  variant = 'subtle',
}: TabBarProps) {
  const pathname = usePathname() ?? ''
  const prominent = variant === 'prominent'

  const containerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'stretch',
    gap: prominent ? 2 : 4,
    overflowX: 'auto',
    overflowY: 'hidden',
    borderBottom: flush ? 'none' : `1px solid ${T.border}`,
    padding: prominent ? '6px 18px 0' : '0 18px',
    background: prominent ? T.surfaceAlt : 'transparent',
  }

  const itemBaseStyle = (active: boolean, disabled: boolean): CSSProperties => {
    if (prominent) {
      return {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '10px 14px 11px',
        fontSize: 13,
        fontWeight: active ? 600 : 500,
        color: disabled ? T.faint : active ? T.ink : T.ink3,
        textDecoration: 'none',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.7 : 1,
        whiteSpace: 'nowrap',
        background: active ? T.surface : 'transparent',
        borderTopLeftRadius: 6,
        borderTopRightRadius: 6,
        border: `1px solid ${active ? T.border : 'transparent'}`,
        borderBottomColor: active ? T.surface : 'transparent',
        marginBottom: -1,
        transition: 'background 120ms ease, color 120ms ease',
      }
    }
    return {
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
    }
  }

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
