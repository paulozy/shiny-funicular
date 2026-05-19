import { CSSProperties } from 'react'
import { T } from '@/lib/tokens'
import { EmbeddingsState, EmbeddingsStatus } from '@/lib/types/repository'

interface EmbeddingsStatusBadgeProps {
  state: EmbeddingsState | undefined
  /** `compact` strips the count into a short label; `default` shows full. */
  size?: 'compact' | 'default'
}

interface Visual {
  label: string
  tone: string
  background: string
  border: string
  pulsing?: boolean
}

const countFormatter = new Intl.NumberFormat('pt-BR', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

function visualForStatus(status: EmbeddingsStatus, count: number, providerConfigured: boolean): Visual {
  if (!providerConfigured && status === 'idle') {
    return {
      label: 'Sem provedor',
      tone: T.faint,
      background: T.surfaceAlt,
      border: T.border,
    }
  }

  switch (status) {
    case 'indexed':
      return {
        label: `Indexado · ${countFormatter.format(count)}`,
        tone: T.ok,
        background: T.okBg,
        border: T.okBorder,
      }
    case 'stale':
      return {
        label: `Desatualizado · ${countFormatter.format(count)}`,
        tone: T.warn,
        background: T.warnBg,
        border: T.warnBorder,
      }
    case 'indexing':
      return {
        label: 'Indexando…',
        tone: T.accent,
        background: T.accentBg,
        border: T.accent,
        pulsing: true,
      }
    case 'pending':
      return {
        label: 'Aguardando',
        tone: T.ink3,
        background: T.surfaceAlt,
        border: T.border,
        pulsing: true,
      }
    case 'failed':
      return {
        label: 'Falhou',
        tone: T.danger,
        background: T.dangerBg,
        border: T.dangerBorder,
      }
    case 'idle':
    default:
      return {
        label: 'Sem índice',
        tone: T.faint,
        background: T.surfaceAlt,
        border: T.border,
      }
  }
}

/**
 * Compact pill summarising the embeddings pipeline state of a repository.
 * Renders nothing when `state` is undefined (e.g. legacy payloads from a
 * pre-migration backend) so old views don't break.
 */
export function EmbeddingsStatusBadge({ state, size = 'default' }: EmbeddingsStatusBadgeProps) {
  if (!state) return null

  const visual = visualForStatus(state.status, state.count, state.provider_configured)

  const compactLabel =
    size === 'compact' && (state.status === 'indexed' || state.status === 'stale')
      ? countFormatter.format(state.count) // "1,2k" style — terse for cards
      : visual.label

  const baseStyle: CSSProperties = {
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
  }

  const title = state.indexed_at
    ? `Última indexação: ${new Date(state.indexed_at).toLocaleString('pt-BR')}`
    : state.error || undefined

  return (
    <span
      style={baseStyle}
      title={title}
      role="status"
      aria-label={`Status do índice semântico: ${visual.label}`}
    >
      {visual.pulsing && <PulsingDot color={visual.tone} />}
      {!visual.pulsing && size !== 'compact' && <Dot color={visual.tone} />}
      {compactLabel}
    </span>
  )
}

function Dot({ color }: { color: string }) {
  return (
    <span
      style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: color,
        flexShrink: 0,
      }}
    />
  )
}

function PulsingDot({ color }: { color: string }) {
  return (
    <span
      className="embeddings-pulse-dot"
      style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: color,
        flexShrink: 0,
      }}
    />
  )
}
