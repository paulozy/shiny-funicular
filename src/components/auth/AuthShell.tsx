import React, { CSSProperties } from 'react'
import { T } from '@/lib/tokens'

interface AuthShellProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
  /**
   * `split` is the v3 sign-in composition: a dark brand panel next to the
   * form. `centered` is the narrow single-column used once the person is
   * already identified (organization selection).
   */
  variant?: 'split' | 'centered'
}

/**
 * The three things the platform does, stated on the sign-in panel.
 *
 * The mockup shows live counters here (repositories, open PRs, mapped
 * relations); nothing is authenticated yet at this point, so the panel states
 * the capabilities instead of inventing numbers.
 */
const PITCH = [
  { title: 'Catálogo', body: 'repositórios, times e donos' },
  { title: 'Documentação', body: 'ADRs e arquitetura por IA' },
  { title: 'Onboarding', body: 'o caminho do time novo' },
]

function BrandPanel() {
  const panelStyle: CSSProperties = {
    padding: '40px 48px',
    display: 'flex',
    flexDirection: 'column',
    background: '#232426',
    color: '#f3f2ef',
  }

  return (
    <div style={panelStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span
          style={{
            width: 30,
            height: 30,
            borderRadius: T.radius.tag,
            background: T.accent,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: 15,
          }}
          aria-hidden="true"
        >
          i
        </span>
        <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em' }}>idp.ai</span>
        <span style={{ fontSize: 12, color: '#9d9b96', marginLeft: 6 }}>
          plataforma interna de desenvolvimento
        </span>
      </div>

      <div style={{ marginTop: 'auto', maxWidth: 520 }}>
        <h1 style={{ fontSize: 44, lineHeight: 1.12, margin: '0 0 16px' }}>
          Repositórios, serviços e documentação sob o mesmo teto.
        </h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, margin: 0, color: '#c3c1bc', maxWidth: '46ch' }}>
          O Code Hub sincroniza PRs, issues, cobertura e o grafo de dependências das suas
          organizações — e mantém o onboarding do time no mesmo lugar.
        </p>
      </div>

      <div
        style={{
          marginTop: 36,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 1,
          background: '#33352f',
          borderRadius: T.radius.button,
          overflow: 'hidden',
        }}
      >
        {PITCH.map((item) => (
          <div key={item.title} style={{ background: '#232426', padding: '16px 18px' }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{item.title}</div>
            <div style={{ fontSize: 12, color: '#9d9b96', marginTop: 2 }}>{item.body}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AuthShell({ title, subtitle, children, footer, variant = 'split' }: AuthShellProps) {
  const formColumnStyle: CSSProperties = {
    padding: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: T.bg,
  }

  const formStyle: CSSProperties = {
    width: '100%',
    maxWidth: variant === 'split' ? 380 : 440,
  }

  const body = (
    <div style={formStyle}>
      <h2 style={{ fontSize: 26, margin: '0 0 6px' }}>{title}</h2>
      {subtitle && (
        <p style={{ fontSize: 14, color: T.ink3, margin: '0 0 24px', lineHeight: 1.5 }}>{subtitle}</p>
      )}
      {children}
      {footer && (
        <div style={{ fontSize: 13, color: T.ink3, marginTop: 18, lineHeight: 1.55 }}>{footer}</div>
      )}
    </div>
  )

  if (variant === 'centered') {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 40,
          background: T.bg,
          color: T.ink,
        }}
      >
        {body}
      </main>
    )
  }

  return (
    <main
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.05fr) minmax(0, 0.95fr)',
        minHeight: '100vh',
        color: T.ink,
      }}
    >
      <BrandPanel />
      <div style={formColumnStyle}>{body}</div>
    </main>
  )
}
