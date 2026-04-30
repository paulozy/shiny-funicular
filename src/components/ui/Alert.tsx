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

  const { bg, border, color } = variantStyles[variant]

  const style: CSSProperties = {
    backgroundColor: bg,
    borderLeft: `3px solid ${border}`,
    color: color,
    padding: '12px 14px',
    borderRadius: '4px',
    fontSize: '13px',
    marginBottom: '16px',
  }

  return <div style={style}>{children}</div>
}
