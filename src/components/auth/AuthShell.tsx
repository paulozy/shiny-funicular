import React, { CSSProperties } from 'react'
import { T } from '@/lib/tokens'
import { Logo } from './Logo'
import { Card } from '../ui/Card'

interface AuthShellProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  const mainStyle: CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: T.bg,
    padding: '16px',
  }

  const containerStyle: CSSProperties = {
    width: '100%',
    maxWidth: 400,
    margin: '0 auto',
  }

  const logoStyle: CSSProperties = {
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'center',
  }

  const cardStyle: CSSProperties = {
    marginBottom: '20px',
  }

  const titleStyle: CSSProperties = {
    fontSize: '22px',
    fontWeight: 600,
    letterSpacing: '-0.01em',
    color: T.ink,
    marginBottom: '4px',
    marginTop: 0,
  }

  const subtitleStyle: CSSProperties = {
    fontSize: '13px',
    color: T.ink3,
    marginBottom: '20px',
    marginTop: 0,
  }

  const footerStyle: CSSProperties = {
    textAlign: 'center' as const,
    fontSize: '13px',
    color: T.ink2,
  }

  return (
    <main style={mainStyle}>
      <div style={containerStyle}>
        <div style={logoStyle}>
          <Logo size={24} showName />
        </div>

        <Card style={cardStyle} padding={32}>
          <h1 style={titleStyle}>{title}</h1>
          {subtitle && <p style={subtitleStyle}>{subtitle}</p>}
          {children}
        </Card>

        {footer && <div style={footerStyle}>{footer}</div>}
      </div>
    </main>
  )
}
