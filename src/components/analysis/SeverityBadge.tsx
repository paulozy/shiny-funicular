import { CSSProperties } from 'react'
import { T } from '@/lib/tokens'
import { SeverityLevel } from '@/lib/types/analysis'

interface SeverityBadgeProps {
  severity: SeverityLevel
  size?: 'compact' | 'default'
}

interface Visual {
  label: string
  tone: string
  background: string
  border: string
}

const labelByLevel: Record<SeverityLevel, string> = {
  critical: 'Crítico',
  error: 'Erro',
  warning: 'Aviso',
  info: 'Info',
}

function visualFor(severity: SeverityLevel): Visual {
  switch (severity) {
    case 'critical':
    case 'error':
      return {
        label: labelByLevel[severity],
        tone: T.danger,
        background: T.dangerBg,
        border: T.dangerBorder,
      }
    case 'warning':
      return {
        label: labelByLevel.warning,
        tone: T.warn,
        background: T.warnBg,
        border: T.warnBorder,
      }
    case 'info':
    default:
      return {
        label: labelByLevel.info,
        tone: T.faint,
        background: T.surfaceAlt,
        border: T.border,
      }
  }
}

export function SeverityBadge({ severity, size = 'default' }: SeverityBadgeProps) {
  const visual = visualFor(severity)
  const style: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: size === 'compact' ? '1px 6px' : '2px 8px',
    fontSize: size === 'compact' ? 10.5 : 11,
    borderRadius: T.radius.tag,
    border: `1px solid ${visual.border}`,
    background: visual.background,
    color: visual.tone,
    fontWeight: 600,
    lineHeight: 1.5,
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  }
  return (
    <span style={style} aria-label={`Severidade: ${visual.label}`} role="status">
      {size === 'default' && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: visual.tone,
            flexShrink: 0,
          }}
        />
      )}
      {visual.label}
    </span>
  )
}
