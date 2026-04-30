import React, { CSSProperties } from 'react'
import { T } from '@/lib/tokens'

interface LogoProps {
  size?: number
  showName?: boolean
}

export function Logo({ size = 22, showName = false }: LogoProps) {
  const containerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  }

  const nameStyle: CSSProperties = {
    fontSize: '15px',
    fontWeight: 700,
    letterSpacing: '-0.01em',
    color: T.ink,
  }

  return (
    <div style={containerStyle}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path
          d="M3 12 Q 8 4 12 12 Q 16 20 21 12"
          fill="none"
          stroke={T.ink}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="12" cy="12" r="2.4" fill={T.accent} />
      </svg>
      {showName && <span style={nameStyle}>idp.ai</span>}
    </div>
  )
}
