'use client'

import { CSSProperties, ReactNode } from 'react'
import { UserInfo } from '@/lib/types/auth'
import { T } from '@/lib/tokens'
import { MFIcon, AISpark } from '@/components/icons/MFIcon'

interface AppShellProps {
  user: UserInfo
  activeHub?: string
  breadcrumb?: string[]
  searchSlot?: ReactNode
  topRight?: ReactNode
  aiPanel?: ReactNode
  aiPanelWidth?: number
  children: ReactNode
}

const HUBS = [
  { id: 'home', label: 'Início', icon: 'home' },
  { id: 'code', label: 'Code', icon: 'code' },
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

  const hubItemStyle = (active: boolean): CSSProperties => ({
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
    cursor: 'pointer',
  })

  const userFooterStyle: CSSProperties = {
    marginTop: 'auto',
    padding: 14,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    borderTop: `1px solid ${T.border}`,
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
    width: aiPanelWidth,
    borderLeft: `1px solid ${T.border}`,
    background: T.surface,
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
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
          <span style={logoStyle}>idp.ai</span>
          <span style={orgBadgeStyle}>{user.organization?.name || 'Org'}</span>
        </div>

        <div style={hubsContainerStyle}>
          {HUBS.map((hub) => {
            const active = hub.id === activeHub
            return (
              <div key={hub.id} style={hubItemStyle(active)}>
                <MFIcon name={hub.icon} size={15} color={active ? T.accent : T.ink3} />
                <span>{hub.label}</span>
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
          <div style={{ marginLeft: 'auto' }}>
            <MFIcon name="gear" size={14} color={T.faint} />
          </div>
        </div>
      </div>

      {/* Main content area */}
      <main style={mainStyle}>
        {/* Topbar */}
        <div style={topbarStyle}>
          {breadcrumb.map((crumb, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {i > 0 && <MFIcon name="chevron-right" size={12} color={T.faint} />}
              <span style={{ ...breadcrumbStyle, color: i === breadcrumb.length - 1 ? T.ink : T.ink3, fontWeight: i === breadcrumb.length - 1 ? 600 : 500 }}>
                {crumb}
              </span>
            </div>
          ))}
          <div style={{ flex: 1 }} />

          {searchSlot || (
            <div style={searchBarStyle}>
              <MFIcon name="search" size={13} color={T.faint} />
              <span>buscar tudo…</span>
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
            </div>
          )}

          {topRight}

          <MFIcon name="bell" size={16} color={T.ink3} />
        </div>

        {/* Content + AI Panel */}
        <div style={contentWrapperStyle}>
          <div style={contentStyle}>{children}</div>
          {aiPanel && <div style={aiPanelStyle}>{aiPanel}</div>}
        </div>
      </main>
    </div>
  )
}
