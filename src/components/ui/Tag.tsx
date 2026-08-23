import React, { CSSProperties } from 'react'
import { T } from '@/lib/tokens'

type Variant = 'default' | 'accent' | 'ai' | 'ok' | 'warn' | 'danger'

interface TagProps {
  variant?: Variant
  children: React.ReactNode
}

export function Tag({ variant = 'default', children }: TagProps) {
  // The design system's `.tag`: a tinted chip with no border, using the 100
  // step of a ramp for the fill and the 800 step for the text.
  const variantStyles: Record<Variant, { bg: string; border: string; color: string }> = {
    default: { bg: T.neutral100, border: T.neutral100, color: T.neutral800 },
    accent: { bg: T.accentBg, border: T.accentBg, color: T.accent800 },
    ai: { bg: T.aiBg, border: T.aiBg, color: T.accent2Ink },
    ok: { bg: T.okBg, border: T.okBg, color: T.ok },
    warn: { bg: T.warnBg, border: T.warnBg, color: T.warn },
    danger: { bg: T.dangerBg, border: T.dangerBg, color: T.danger },
  }

  const { bg, color } = variantStyles[variant]

  const style: CSSProperties = {
    display: 'inline-block',
    backgroundColor: bg,
    color: color,
    padding: '3px 10px',
    borderRadius: T.radius.tag,
    fontSize: '11px',
    fontWeight: 500,
    letterSpacing: '0.02em',
    whiteSpace: 'nowrap',
  }

  return <span style={style}>{children}</span>
}
