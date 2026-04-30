import React, { CSSProperties } from 'react'
import { T } from '@/lib/tokens'

type Variant = 'default' | 'accent' | 'ai' | 'ok' | 'warn' | 'danger'

interface TagProps {
  variant?: Variant
  children: React.ReactNode
}

export function Tag({ variant = 'default', children }: TagProps) {
  const variantStyles: Record<Variant, { bg: string; border: string; color: string }> = {
    default: { bg: T.surfaceAlt, border: T.border, color: T.ink2 },
    accent: { bg: T.accentBg, border: T.accentBg, color: T.accent },
    ai: { bg: T.aiBg, border: T.aiBorder, color: T.ai },
    ok: { bg: T.okBg, border: T.okBorder, color: T.ok },
    warn: { bg: T.warnBg, border: T.warnBorder, color: T.warn },
    danger: { bg: T.dangerBg, border: T.dangerBorder, color: T.danger },
  }

  const { bg, color } = variantStyles[variant]

  const style: CSSProperties = {
    display: 'inline-block',
    backgroundColor: bg,
    color: color,
    padding: '2px 8px',
    borderRadius: T.radius.tag,
    fontSize: '11px',
    fontWeight: 500,
    whiteSpace: 'nowrap',
  }

  return <span style={style}>{children}</span>
}
