'use client'

import { CSSProperties, ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { UserInfo } from '@/lib/types/auth'
import { T } from '@/lib/tokens'
import { ThemeToggle } from '@/components/shell/ThemeToggle'
import { CommandPalette, CommandPaletteAction } from '@/components/shell/CommandPalette'
import { CodeHubTab, CodeHubTabBar } from '@/components/shell/CodeHubTabBar'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface AppShellProps {
  user: UserInfo
  activeHub?: string
  /**
   * Kept so callers that still describe their position can pass it — v3 shows
   * the hub row and a per-screen back link instead of a breadcrumb trail, so
   * only the last item is rendered, as an eyebrow above the page title area.
   */
  breadcrumb?: Array<string | BreadcrumbItem>
  searchSlot?: ReactNode
  /**
   * Which Code Hub section is open. The row lives in the sticky header rather
   * than in the page body: seated in the content flow it shifted with every
   * page's height and scrolled away, which read as the navigation moving on
   * its own.
   */
  codeTab?: CodeHubTab
  /** Page-level primary action, rendered where the mockup puts "Novo repositório". */
  topRight?: ReactNode
  /** Drop the centered content container — for screens that manage their own canvas. */
  fullBleed?: boolean
  children: ReactNode
}

const HUBS = [
  { id: 'code', label: 'Code', href: '/' },
  { id: 'infra', label: 'Infra' },
  { id: 'arch', label: 'Arquitetura' },
  { id: 'deploy', label: 'Deploys' },
  { id: 'obs', label: 'Observability' },
  { id: 'kb', label: 'Knowledge' },
]

const MAX_WIDTH = 1400

export function AppShell({
  user,
  activeHub = 'code',
  searchSlot,
  codeTab,
  topRight,
  fullBleed = false,
  children,
}: AppShellProps) {
  const router = useRouter()
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [orgMenuOpen, setOrgMenuOpen] = useState(false)
  const headerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setUserMenuOpen(false)
        setOrgMenuOpen(false)
        return
      }
      if (!(event.metaKey || event.ctrlKey) || event.altKey) return
      if (event.key.toLowerCase() !== 'k') return
      event.preventDefault()
      setPaletteOpen((current) => !current)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (!userMenuOpen && !orgMenuOpen) return
    const onPointerDown = (event: MouseEvent) => {
      if (headerRef.current?.contains(event.target as Node)) return
      setUserMenuOpen(false)
      setOrgMenuOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [userMenuOpen, orgMenuOpen])

  const paletteActions: CommandPaletteAction[] = useMemo(
    () => [
      {
        id: 'open-settings',
        label: 'Configurações da organização',
        icon: 'gear',
        onSelect: () => router.push('/settings'),
      },
    ],
    [router]
  )

  const orgName = user.organization?.name || 'Organização'

  const headerStyle: CSSProperties = {
    position: 'sticky',
    top: 0,
    zIndex: 20,
    background: T.surface,
    borderBottom: `1px solid ${T.border}`,
  }

  const rowStyle: CSSProperties = {
    maxWidth: MAX_WIDTH,
    margin: '0 auto',
    padding: '0 28px',
    height: 56,
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  }

  const markStyle: CSSProperties = {
    width: 26,
    height: 26,
    borderRadius: T.radius.tag,
    background: T.accent,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: 700,
    fontSize: 13,
    flexShrink: 0,
  }

  const chipStyle: CSSProperties = {
    font: 'inherit',
    fontSize: 13,
    color: T.ink3,
    background: T.neutral100,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.tag,
    padding: '4px 10px',
    cursor: 'pointer',
    display: 'inline-flex',
    gap: 6,
    alignItems: 'center',
  }

  const searchStyle: CSSProperties = {
    font: 'inherit',
    fontSize: 13,
    color: T.faint,
    background: T.bg,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.tag,
    padding: '6px 10px',
    width: 260,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
    textAlign: 'left',
  }

  const settingsLinkStyle: CSSProperties = {
    font: 'inherit',
    fontSize: 13,
    background: 'none',
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.button,
    color: T.ink3,
    padding: '6px 10px',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  }

  const avatarButtonStyle: CSSProperties = {
    width: 30,
    height: 30,
    borderRadius: '50%',
    background: T.accent2,
    color: '#fff',
    border: 0,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 13,
    flexShrink: 0,
  }

  const hubsRowStyle: CSSProperties = {
    maxWidth: MAX_WIDTH,
    margin: '0 auto',
    padding: '0 28px',
    display: 'flex',
    alignItems: 'center',
    gap: 22,
    height: 40,
    overflowX: 'auto',
  }

  const hubStyle = (active: boolean, disabled: boolean): CSSProperties => ({
    font: 'inherit',
    fontSize: 13.5,
    background: 'none',
    border: 0,
    padding: '0 0 10px',
    cursor: disabled ? 'default' : 'pointer',
    color: active ? T.ink : disabled ? T.neutral500 : T.ink3,
    borderBottom: `2px solid ${active ? T.accent : 'transparent'}`,
    fontWeight: active ? 600 : 500,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  })

  const menuStyle: CSSProperties = {
    position: 'absolute',
    top: 50,
    zIndex: 40,
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.button,
    boxShadow: T.shadowMd,
    padding: 6,
    minWidth: 230,
  }

  const menuItemStyle: CSSProperties = {
    width: '100%',
    textAlign: 'left',
    font: 'inherit',
    fontSize: 13,
    background: 'none',
    border: 0,
    padding: '8px 10px',
    borderRadius: T.radius.tag,
    cursor: 'pointer',
    color: T.ink,
    textDecoration: 'none',
    display: 'block',
  }

  const contentStyle: CSSProperties = fullBleed
    ? { flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }
    : {
        // `width: 100%` is load-bearing, not belt-and-braces. This element is a
        // flex item of the column below, and an `auto` cross-axis margin
        // suppresses `align-items: stretch` — so with `margin: 0 auto` alone the
        // box became shrink-to-fit and every page in the app rendered as a
        // narrow column adrift in whitespace, never reaching MAX_WIDTH. The
        // header rows escaped it only because they are blocks inside <header>.
        width: '100%',
        maxWidth: MAX_WIDTH,
        margin: '0 auto',
        padding: '26px 28px 70px',
      }

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      router.push('/login')
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: T.bg,
        color: T.ink,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <header ref={headerRef} style={headerStyle}>
        <div style={{ ...rowStyle, position: 'relative' }}>
          <span style={markStyle} aria-hidden="true">
            i
          </span>
          <Link
            href="/"
            style={{ fontWeight: 600, fontSize: 15, color: T.ink, textDecoration: 'none' }}
          >
            idp.ai
          </Link>

          <button
            type="button"
            onClick={() => {
              setOrgMenuOpen((open) => !open)
              setUserMenuOpen(false)
            }}
            aria-haspopup="menu"
            aria-expanded={orgMenuOpen}
            style={chipStyle}
          >
            {orgName}
            <span style={{ fontSize: 10 }} aria-hidden="true">
              ▾
            </span>
          </button>

          <span style={{ flex: 1 }} />

          {searchSlot || (
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              aria-label="Abrir paleta de comandos"
              title="Abrir paleta de comandos (Ctrl/Cmd+K)"
              style={searchStyle}
            >
              <span>Buscar rotas, repos e ações…</span>
              <span
                style={{
                  marginLeft: 'auto',
                  fontFamily: T.mono,
                  fontSize: 11,
                  border: `1px solid ${T.border}`,
                  borderRadius: 3,
                  padding: '1px 5px',
                }}
              >
                ⌘K
              </span>
            </button>
          )}

          {topRight}

          <Link
            href="/settings"
            title="Configurações da organização"
            aria-label="Configurações da organização"
            style={settingsLinkStyle}
          >
            Configurações
          </Link>

          <ThemeToggle />

          <button
            type="button"
            onClick={() => {
              setUserMenuOpen((open) => !open)
              setOrgMenuOpen(false)
            }}
            aria-label="Menu do usuário"
            aria-haspopup="menu"
            aria-expanded={userMenuOpen}
            style={avatarButtonStyle}
          >
            {(user.full_name || user.email || '?').slice(0, 1).toUpperCase()}
          </button>

          {orgMenuOpen && (
            <div role="menu" style={{ ...menuStyle, left: 180 }}>
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: '.08em',
                  textTransform: 'uppercase',
                  color: T.faint,
                  padding: '8px 10px 4px',
                }}
              >
                Organizações
              </div>
              <div style={{ ...menuItemStyle, display: 'flex', gap: 8, alignItems: 'center' }}>
                {orgName}
                <span style={{ flex: 1 }} />
                <span style={{ fontSize: 11, color: T.faint }}>{user.organization?.role}</span>
              </div>
              <Link
                href="/select-organization"
                role="menuitem"
                style={{ ...menuItemStyle, color: T.accent700 }}
                onClick={() => setOrgMenuOpen(false)}
              >
                Trocar de organização
              </Link>
            </div>
          )}

          {userMenuOpen && (
            <div role="menu" style={{ ...menuStyle, right: 28 }}>
              <div style={{ padding: '8px 10px' }}>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{user.full_name}</div>
                <div style={{ fontSize: 12, color: T.faint }}>
                  {user.email} · {user.role}
                </div>
              </div>
              <Link
                href="/settings"
                role="menuitem"
                style={menuItemStyle}
                onClick={() => setUserMenuOpen(false)}
              >
                Configurações da organização
              </Link>
              <Link
                href="/onboarding"
                role="menuitem"
                style={menuItemStyle}
                onClick={() => setUserMenuOpen(false)}
              >
                Meu onboarding
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                style={{ ...menuItemStyle, color: T.danger }}
              >
                Sair
              </button>
            </div>
          )}
        </div>

        <nav aria-label="Navegação principal" style={hubsRowStyle}>
          {HUBS.map((hub) => {
            const active = hub.id === activeHub
            if (hub.href) {
              return (
                <Link
                  key={hub.id}
                  href={hub.href}
                  style={hubStyle(active, false)}
                  aria-current={active ? 'page' : undefined}
                  title="Code Hub"
                >
                  {hub.label}
                </Link>
              )
            }
            return (
              <span
                key={hub.id}
                aria-disabled="true"
                aria-label={`${hub.label} — Em breve`}
                title={`${hub.label} — Em breve`}
                style={hubStyle(false, true)}
              >
                {hub.label}
              </span>
            )
          })}
        </nav>

        {codeTab && (
          <div
            style={{
              maxWidth: MAX_WIDTH,
              margin: '0 auto',
              padding: '0 28px',
              borderTop: `1px solid ${T.neutral200}`,
            }}
          >
            <CodeHubTabBar
              activeTab={codeTab}
              style={{ marginBottom: 0, height: 40, alignItems: 'flex-end', paddingBottom: 0 }}
            />
          </div>
        )}
      </header>

      <div style={contentStyle}>{children}</div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} actions={paletteActions} />
    </div>
  )
}
