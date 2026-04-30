import React, { CSSProperties } from 'react'
import { T } from '@/lib/tokens'

interface CardProps {
  children: React.ReactNode
  style?: CSSProperties
  padding?: number
}

export function Card({ children, style, padding = 16 }: CardProps) {
  const baseStyle: CSSProperties = {
    backgroundColor: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.card,
    padding: padding,
    ...style,
  }

  return <div style={baseStyle}>{children}</div>
}
