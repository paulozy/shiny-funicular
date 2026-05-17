'use client'

import { CSSProperties, ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { UserInfo } from '@/lib/types/auth'
import { T } from '@/lib/tokens'
import { MFIcon, AISpark } from '@/components/icons/MFIcon'
import { ThemeToggle } from '@/components/shell/ThemeToggle'
import { CommandPalette, CommandPaletteAction } from '@/components/shell/CommandPalette'

type SidebarMode = 'expanded' | 'collapsed'

const SIDEBAR_STORAGE_KEY = 'idp-sidebar-mode'

function readInitialSidebarMode(): SidebarMode {
  if (typeof document === 'undefined') return 'expanded'
  const fromDataset = document.documentElement.dataset.sidebarMode
  if (fromDataset === 'collapsed' || fromDataset === 'expanded') return fromDataset
  return 'expanded'
}

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface AppShellProps {
  user: UserInfo
  activeHub?: string
  breadcrumb?: Array<string | BreadcrumbItem>
  searchSlot?: ReactNode
  topRight?: ReactNode
  aiPanel?: ReactNode
  aiPanelWidth?: number
  children: ReactNode
}

const HUBS = [
  { id: 'code', label: 'Code', icon: 'code', href: '/' },
  { id: 'infra', label: 'Infra', icon: 'box' },
  { id: 'arch', label: 'Arquitetura', icon: 'graph' },
  { id: 'deploy', label: 'Deploys', icon: 'rocket' },
  { id: 'obs', label: 'Observability', icon: 'star' },
  { id: 'kb', label: 'Knowledge', icon: 'doc' },
]

function MFAvatar({ name = 'M', size = 26 }: { name?: string; size?: number }) {
  const colors = ['#d97757', '#7a4cc8', '#3a8c5a', '#3970bf', '#bf6940', '#52789e']
  const idx = (name?.charCodeAt(0) || 77) % colors.length
  const bg = colors[idx]

  return (
    <div
      className="mf-avatar"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: bg,
        color: '#fff',
        fontSize: size * 0.42,
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        letterSpacing: 0,
        flexShrink: 0,
        fontFamily: T.font,
      }}
    >
      {(name || 'M').slice(0, 1).toUpperCase()}
    </div>
  )
}

export function AppShell({
  user,
  activeHub = 'code',
  breadcrumb = [],
  searchSlot,
  topRight,
  aiPanel,
  aiPanelWidth = 320,
  children,
}: AppShellProps) {
  const [aiPanelMode, setAiPanelMode] = useState<'collapsed' | 'normal' | 'expanded'>('normal')
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>(() => readInitialSidebarMode())
  const [paletteOpen, setPaletteOpen] = useState(false)
  const normalizedBreadcrumb = breadcrumb.map((item) => (typeof item === 'string' ? { label: item } : item))
  const resolvedAiPanelWidth = aiPanelMode === 'collapsed' ? 52 : aiPanelMode === 'expanded' ? 420 : aiPanelWidth
  const sidebarCollapsed = sidebarMode === 'collapsed'
  const sidebarWidth = sidebarCollapsed ? 56 : 220

  const applySidebarMode = (mode: SidebarMode) => {
    setSidebarMode(mode)
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.sidebarMode = mode
    }
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(SIDEBAR_STORAGE_KEY, mode)
      } catch {
        /* storage unavailable — silent */
      }
    }
  }

  const toggleSidebar = () => applySidebarMode(sidebarCollapsed ? 'expanded' : 'collapsed')

  const toggleAiPanel = useCallback(() => {
    setAiPanelMode((current) => (current === 'collapsed' ? 'normal' : 'collapsed'))
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.altKey) return
      const key = event.key.toLowerCase()
      if (key !== 'b' && key !== 'k' && key !== 'j') return

      // For Cmd+B and Cmd+J we don't want to fire while typing in an input. The
      // command palette (Cmd+K) is allowed to open from anywhere — it's the
      // canonical escape hatch.
      const target = event.target as HTMLElement | null
      const inEditable =
        !!target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)

      if (key === 'k') {
        event.preventDefault()
        setPaletteOpen((current) => !current)
        return
      }

      if (inEditable || event.shiftKey) return

      if (key === 'b') {
        event.preventDefault()
        toggleSidebar()
        return
      }

      if (key === 'j') {
        event.preventDefault()
        toggleAiPanel()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [sidebarCollapsed, toggleAiPanel])

  const paletteActions: CommandPaletteAction[] = useMemo(
    () => [
      {
        id: 'toggle-sidebar',
        label: sidebarCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral',
        icon: sidebarCollapsed ? 'chevron-right' : 'chevron-left',
        onSelect: toggleSidebar,
      },
      {
        id: 'toggle-ai-panel',
        label: aiPanelMode === 'collapsed' ? 'Abrir Co-pensador' : 'Recolher Co-pensador',
        icon: 'star',
        onSelect: toggleAiPanel,
      },
    ],
    [sidebarCollapsed, aiPanelMode, toggleAiPanel]
  )

  const containerStyle: CSSProperties = {
    width: '100%',
    minHeight: '100vh',
    height: '100vh',
    background: T.bg,
    display: 'flex',
    overflow: 'hidden',
  }

  const sidebarStyle: CSSProperties = {
    width: sidebarWidth,
    background: T.surfaceAlt,
    borderRight: `1px solid ${T.border}`,
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    transition: 'width 160ms ease',
    overflow: 'hidden',
  }

  const sidebarHeaderStyle: CSSProperties = {
    padding: sidebarCollapsed ? '18px 0 14px' : '18px 16px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
  }

  const sidebarToggleStyle: CSSProperties = {
    appearance: 'none',
    border: `1px solid ${T.border}`,
    borderRadius: 6,
    background: T.surface,
    color: T.ink3,
    width: 26,
    height: 26,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: 0,
    marginLeft: sidebarCollapsed ? 0 : 'auto',
  }

  const logoStyle: CSSProperties = {
    fontWeight: 700,
    fontSize: 15,
    letterSpacing: '-0.01em',
    color: T.ink,
    textDecoration: 'none',
  }

  const orgBadgeStyle: CSSProperties = {
    marginLeft: 'auto',
    fontSize: 11,
    color: T.faint,
  }

  const hubsContainerStyle: CSSProperties = {
    padding: sidebarCollapsed ? '4px 6px' : '4px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
  }

  const hubItemStyle = (active: boolean, disabled = false): CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: sidebarCollapsed ? 0 : 10,
    padding: sidebarCollapsed ? '8px 0' : '7px 10px',
    justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
    borderRadius: 6,
    background: active ? T.surface : 'transparent',
    color: active ? T.ink : T.ink2,
    fontWeight: active ? 600 : 500,
    fontSize: 13,
    boxShadow: active ? '0 1px 0 rgba(0,0,0,.04), 0 0 0 1px rgba(0,0,0,.04)' : 'none',
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.48 : 1,
    textDecoration: 'none',
  })

  const userFooterStyle: CSSProperties = {
    marginTop: 'auto',
    padding: sidebarCollapsed ? '10px 6px' : 14,
    display: 'flex',
    flexDirection: sidebarCollapsed ? 'column' : 'row',
    alignItems: 'center',
    gap: sidebarCollapsed ? 8 : 10,
    borderTop: `1px solid ${T.border}`,
  }

  const footerActionsStyle: CSSProperties = {
    marginLeft: sidebarCollapsed ? 0 : 'auto',
    display: 'flex',
    flexDirection: sidebarCollapsed ? 'column' : 'row',
    alignItems: 'center',
    gap: 6,
  }

  const settingsLinkStyle: CSSProperties = {
    width: 28,
    height: 28,
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: activeHub === 'settings' ? T.surface : 'transparent',
    color: T.faint,
    textDecoration: 'none',
  }

  const userNameStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  }

  const userInitialStyle: CSSProperties = {
    fontSize: 12.5,
    fontWeight: 600,
  }

  const userEmailStyle: CSSProperties = {
    fontSize: 11,
    color: T.faint,
  }

  const mainStyle: CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  }

  const topbarStyle: CSSProperties = {
    height: 52,
    padding: '0 18px',
    borderBottom: `1px solid ${T.border}`,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: T.surface,
    flexShrink: 0,
  }

  const breadcrumbStyle: CSSProperties = {
    fontSize: 13,
    fontWeight: 500,
  }

  const searchBarStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '5px 10px',
    border: `1px solid ${T.border}`,
    borderRadius: 6,
    background: T.surface,
    width: 280,
    color: T.faint,
    fontSize: 12.5,
  }

  const contentWrapperStyle: CSSProperties = {
    flex: 1,
    display: 'flex',
    minHeight: 0,
  }

  const contentStyle: CSSProperties = {
    flex: 1,
    overflow: 'auto',
    minWidth: 0,
  }

  const aiPanelStyle: CSSProperties = {
    width: resolvedAiPanelWidth,
    borderLeft: `1px solid ${T.border}`,
    background: T.surface,
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    position: 'relative',
    transition: 'width 160ms ease',
  }

  const aiPanelControlsStyle: CSSProperties = {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 2,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  }

  const aiControlButtonStyle: CSSProperties = {
    appearance: 'none',
    border: `1px solid ${T.border}`,
    borderRadius: 5,
    background: T.surface,
    color: T.ink3,
    width: 24,
    height: 24,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  }

  const collapsedAiStyle: CSSProperties = {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    writingMode: 'vertical-rl',
    transform: 'rotate(180deg)',
    gap: 8,
    color: T.ink3,
    fontSize: 12,
    fontWeight: 600,
  }

  return (
    <div style={containerStyle}>
      {/* Sidebar */}
      <aside
        style={sidebarStyle}
        data-sidebar-mode={sidebarMode}
        aria-label="Navegação principal"
      >
        <div style={sidebarHeaderStyle}>
          {!sidebarCollapsed && (
            <>
              <svg width="22" height="22" viewBox="0 0 24 24">
                <path
                  d="M3 12 Q 8 4 12 12 Q 16 20 21 12"
                  fill="none"
                  stroke={T.ink}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle cx="12" cy="12" r="2.4" fill={T.accent} />
              </svg>
              <Link href="/" style={logoStyle}>idp.ai</Link>
              <span style={orgBadgeStyle} title={user.organization?.name || 'Org'}>
                {user.organization?.name || 'Org'}
              </span>
            </>
          )}
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={sidebarCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
            aria-expanded={!sidebarCollapsed}
            aria-controls="app-sidebar-hubs"
            title={`${sidebarCollapsed ? 'Expandir' : 'Recolher'} menu (Ctrl/Cmd+B)`}
            style={sidebarToggleStyle}
          >
            <MFIcon name={sidebarCollapsed ? 'chevron-right' : 'chevron-left'} size={12} color="currentColor" />
          </button>
        </div>

        <div id="app-sidebar-hubs" style={hubsContainerStyle}>
          {HUBS.map((hub) => {
            const active = hub.id === activeHub
            const disabled = !hub.href
            const itemTitle = disabled
              ? `${hub.label} — Em breve`
              : sidebarCollapsed
                ? hub.label
                : undefined
            const content = (
              <>
                <MFIcon name={hub.icon} size={15} color={active ? T.accent : T.ink3} />
                {!sidebarCollapsed && <span>{hub.label}</span>}
              </>
            )

            if (hub.href) {
              return (
                <Link
                  key={hub.id}
                  href={hub.href}
                  style={hubItemStyle(active)}
                  title={itemTitle}
                  aria-label={sidebarCollapsed ? hub.label : undefined}
                >
                  {content}
                </Link>
              )
            }

            return (
              <div
                key={hub.id}
                aria-disabled="true"
                aria-label={sidebarCollapsed ? `${hub.label} — Em breve` : undefined}
                title={itemTitle}
                style={hubItemStyle(active, disabled)}
              >
                {content}
              </div>
            )
          })}
        </div>

        <div style={userFooterStyle}>
          <MFAvatar name={user.full_name} size={28} />
          {!sidebarCollapsed && (
            <div style={userNameStyle}>
              <span style={userInitialStyle}>{user.full_name}</span>
              <span style={userEmailStyle}>{user.email}</span>
            </div>
          )}
          <div style={footerActionsStyle}>
            <ThemeToggle />
            <Link
              href="/settings"
              aria-label="Configurações da organização"
              title="Configurações da organização"
              style={settingsLinkStyle}
            >
              <MFIcon name="gear" size={14} color={T.faint} />
            </Link>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <main style={mainStyle}>
        {/* Topbar */}
        <div style={topbarStyle}>
          {normalizedBreadcrumb.map((crumb, i) => {
            const isLast = i === normalizedBreadcrumb.length - 1
            return (
            <div key={`${crumb.label}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {i > 0 && <MFIcon name="chevron-right" size={12} color={T.faint} />}
              {!isLast && crumb.href ? (
                <Link
                  href={crumb.href}
                  style={{
                    ...breadcrumbStyle,
                    color: T.ink3,
                    fontWeight: 500,
                    textDecoration: 'none',
                  }}
                >
                  {crumb.label}
                </Link>
              ) : (
                <span style={{ ...breadcrumbStyle, color: isLast ? T.ink : T.ink3, fontWeight: isLast ? 600 : 500 }}>
                  {crumb.label}
                </span>
              )}
            </div>
            )
          })}
          <div style={{ flex: 1 }} />

          {searchSlot || (
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              aria-label="Abrir paleta de comandos"
              title="Abrir paleta de comandos (Ctrl/Cmd+K)"
              style={{
                ...searchBarStyle,
                cursor: 'pointer',
                appearance: 'none',
                textAlign: 'left',
              }}
            >
              <MFIcon name="search" size={13} color={T.faint} />
              <span>Buscar rotas, repos e ações…</span>
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: 10.5,
                  padding: '1px 5px',
                  border: `1px solid ${T.border}`,
                  borderRadius: 4,
                  background: T.surface,
                  color: T.ink3,
                  fontFamily: T.mono,
                }}
              >
                ⌘K
              </span>
            </button>
          )}

          {topRight}

          <MFIcon name="bell" size={16} color={T.ink3} />
        </div>

        {/* Content + AI Panel */}
        <div style={contentWrapperStyle}>
          <div style={contentStyle}>{children}</div>
          {aiPanel && (
            <div style={aiPanelStyle} data-ai-panel-mode={aiPanelMode}>
              {aiPanelMode === 'collapsed' ? (
                <button
                  type="button"
                  aria-label="Expandir Co-pensador"
                  style={{ ...collapsedAiStyle, border: 0, background: 'transparent', cursor: 'pointer' }}
                  onClick={() => setAiPanelMode('normal')}
                >
                  <AISpark size={14} />
                  Co-pensador
                </button>
              ) : (
                <>
                  <div style={aiPanelControlsStyle}>
                    <button
                      type="button"
                      aria-label="Recolher Co-pensador"
                      title="Recolher Co-pensador"
                      style={aiControlButtonStyle}
                      onClick={() => setAiPanelMode('collapsed')}
                    >
                      <MFIcon name="chevron-right" size={12} color="currentColor" />
                    </button>
                    <button
                      type="button"
                      aria-label={aiPanelMode === 'expanded' ? 'Restaurar Co-pensador' : 'Expandir Co-pensador'}
                      title={aiPanelMode === 'expanded' ? 'Restaurar Co-pensador' : 'Expandir Co-pensador'}
                      style={aiControlButtonStyle}
                      onClick={() => setAiPanelMode((current) => (current === 'expanded' ? 'normal' : 'expanded'))}
                    >
                      <MFIcon name={aiPanelMode === 'expanded' ? 'chevron-right' : 'chevron-down'} size={12} color="currentColor" />
                    </button>
                  </div>
                  {aiPanel}
                </>
              )}
            </div>
          )}
        </div>
      </main>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} actions={paletteActions} />
    </div>
  )
}
