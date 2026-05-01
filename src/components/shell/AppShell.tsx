'use client'

import { CSSProperties, ReactNode, useState } from 'react'
import Link from 'next/link'
import { UserInfo } from '@/lib/types/auth'
import { T } from '@/lib/tokens'
import { MFIcon, AISpark } from '@/components/icons/MFIcon'
import { ThemeToggle } from '@/components/shell/ThemeToggle'

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
  const normalizedBreadcrumb = breadcrumb.map((item) => (typeof item === 'string' ? { label: item } : item))
  const resolvedAiPanelWidth = aiPanelMode === 'collapsed' ? 52 : aiPanelMode === 'expanded' ? 420 : aiPanelWidth

  const containerStyle: CSSProperties = {
    width: '100%',
    minHeight: '100vh',
    height: '100vh',
    background: T.bg,
    display: 'flex',
    overflow: 'hidden',
  }

  const sidebarStyle: CSSProperties = {
    width: 220,
    background: T.surfaceAlt,
    borderRight: `1px solid ${T.border}`,
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
  }

  const sidebarHeaderStyle: CSSProperties = {
    padding: '18px 16px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
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
    padding: '4px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
  }

  const hubItemStyle = (active: boolean, disabled = false): CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '7px 10px',
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
    padding: 14,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    borderTop: `1px solid ${T.border}`,
  }

  const footerActionsStyle: CSSProperties = {
    marginLeft: 'auto',
    display: 'flex',
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
      <div style={sidebarStyle}>
        <div style={sidebarHeaderStyle}>
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
          <span style={orgBadgeStyle}>{user.organization?.name || 'Org'}</span>
        </div>

        <div style={hubsContainerStyle}>
          {HUBS.map((hub) => {
            const active = hub.id === activeHub
            const disabled = !hub.href
            const content = (
              <>
                <MFIcon name={hub.icon} size={15} color={active ? T.accent : T.ink3} />
                <span>{hub.label}</span>
              </>
            )

            if (hub.href) {
              return (
                <Link key={hub.id} href={hub.href} style={hubItemStyle(active)}>
                  {content}
                </Link>
              )
            }

            return (
              <div key={hub.id} aria-disabled="true" title="Em breve" style={hubItemStyle(active, disabled)}>
                {content}
              </div>
            )
          })}
        </div>

        <div style={userFooterStyle}>
          <MFAvatar name={user.full_name} size={28} />
          <div style={userNameStyle}>
            <span style={userInitialStyle}>{user.full_name}</span>
            <span style={userEmailStyle}>{user.email}</span>
          </div>
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
      </div>

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
            <div
              style={{
                ...searchBarStyle,
                opacity: 0.72,
                cursor: 'default',
              }}
              aria-disabled="true"
              title="Busca global em breve"
            >
              <MFIcon name="search" size={13} color={T.faint} />
              <span>busca global em breve</span>
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
                em breve
              </span>
            </div>
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
    </div>
  )
}
