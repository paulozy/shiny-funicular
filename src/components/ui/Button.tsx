import React, { useState, CSSProperties } from 'react'
import { T } from '@/lib/tokens'

type Variant = 'default' | 'primary' | 'accent' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  children: React.ReactNode
}

export function Button({
  variant = 'default',
  size = 'md',
  loading = false,
  disabled,
  children,
  onClick,
  style,
  ...props
}: ButtonProps) {
  const [isHovered, setIsHovered] = useState(false)

  const sizeStyles: Record<Size, CSSProperties> = {
    sm: { padding: '4px 10px', fontSize: '12px', borderRadius: T.radius.button - 2 },
    md: { padding: '7px 13px', fontSize: '13px', borderRadius: T.radius.button },
    lg: { padding: '10px 16px', fontSize: '14px', borderRadius: T.radius.button },
  }

  // v3: the filled button is the accent (teal), not ink — `primary` and
  // `accent` are the same button now, `accent` kept so existing call sites
  // keep compiling.
  const variantStyles: Record<Variant, CSSProperties> = {
    default: {
      backgroundColor: isHovered ? T.neutral100 : T.surface,
      color: T.ink,
      border: `1px solid ${T.border}`,
    },
    primary: {
      backgroundColor: isHovered ? T.accentHover : T.accent,
      color: T.inkInverse,
      border: '1px solid transparent',
    },
    accent: {
      backgroundColor: isHovered ? T.accentHover : T.accent,
      color: T.inkInverse,
      border: '1px solid transparent',
    },
    ghost: {
      backgroundColor: isHovered ? T.accentBg : 'transparent',
      color: T.accent700,
      border: '1px solid transparent',
    },
  }

  const baseStyle: CSSProperties = {
    fontWeight: 600,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.6 : 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    transition: 'all 0.15s ease',
    ...sizeStyles[size],
    ...variantStyles[variant],
    ...style,
  }

  return (
    <button
      {...props}
      disabled={disabled || loading}
      onClick={onClick}
      onMouseEnter={() => !disabled && !loading && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={baseStyle}
    >
      {loading && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
          <path d="M22 12a10 10 0 1 1-20 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )}
      {children}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </button>
  )
}
