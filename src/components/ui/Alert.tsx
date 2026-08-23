import React, { CSSProperties } from 'react'
import { T } from '@/lib/tokens'

type Variant = 'ok' | 'warn' | 'danger'

interface AlertProps {
  variant: Variant
  children: React.ReactNode
}

export function Alert({ variant, children }: AlertProps) {
  const variantStyles: Record<Variant, { bg: string; border: string; color: string }> = {
    ok: { bg: T.okBg, border: T.okBorder, color: T.ok },
    warn: { bg: T.warnBg, border: T.warnBorder, color: T.warn },
    danger: { bg: T.dangerBg, border: T.dangerBorder, color: T.danger },
  }

  const { bg, color } = variantStyles[variant]

  // v3 tints the whole block instead of hanging a rule off its left edge —
  // the same treatment the inline alerts in the mockup use.
  const style: CSSProperties = {
    backgroundColor: bg,
    color: color,
    padding: '10px 12px',
    borderRadius: T.radius.button,
    fontSize: '13px',
    lineHeight: 1.5,
    marginBottom: '14px',
  }

  return <div style={style}>{children}</div>
}
