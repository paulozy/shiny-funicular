import { CSSProperties } from 'react'
import { T } from '@/lib/tokens'
import { MFIcon } from '@/components/icons/MFIcon'
import {
  CoverageStatus,
  EmbeddingsState,
  RepositoryAnalysisStatus,
  RepositoryResponse,
} from '@/lib/types/repository'

interface RepoHealthCardProps {
  repo: RepositoryResponse
  embeddingsState?: EmbeddingsState
  coverage: {
    percentage?: number
    status: CoverageStatus | '' | undefined
  }
}

type Tone = 'ok' | 'warn' | 'danger' | 'accent' | 'neutral'

interface Pill {
  key: string
  label: string
  value: string
  tone: Tone
}

const TONE_COLORS: Record<Tone, string> = {
  ok: T.ok,
  warn: T.warn,
  danger: T.danger,
  accent: T.accent,
  neutral: T.faint,
}

function syncPill(status?: string): Pill {
  switch (status) {
    case 'synced':
      return { key: 'sync', label: 'Sync', value: 'em dia', tone: 'ok' }
    case 'syncing':
      return { key: 'sync', label: 'Sync', value: 'em andamento', tone: 'accent' }
    case 'error':
      return { key: 'sync', label: 'Sync', value: 'falhou', tone: 'danger' }
    case 'idle':
    default:
      return { key: 'sync', label: 'Sync', value: 'inativo', tone: 'neutral' }
  }
}

function analysisPill(status: RepositoryAnalysisStatus | string | null | undefined): Pill {
  switch (status) {
    case 'completed':
      return { key: 'analysis', label: 'Análise', value: 'concluída', tone: 'ok' }
    case 'in_progress':
      return { key: 'analysis', label: 'Análise', value: 'em andamento', tone: 'accent' }
    case 'failed':
      return { key: 'analysis', label: 'Análise', value: 'falhou', tone: 'danger' }
    case 'pending':
    default:
      return { key: 'analysis', label: 'Análise', value: 'pendente', tone: 'warn' }
  }
}

function embeddingsPill(state?: EmbeddingsState): Pill {
  if (!state || !state.provider_configured) {
    return { key: 'embeddings', label: 'Embeddings', value: 'sem provedor', tone: 'neutral' }
  }
  switch (state.status) {
    case 'indexed':
      return { key: 'embeddings', label: 'Embeddings', value: 'indexado', tone: 'ok' }
    case 'indexing':
    case 'pending':
      return { key: 'embeddings', label: 'Embeddings', value: 'em andamento', tone: 'accent' }
    case 'stale':
      return { key: 'embeddings', label: 'Embeddings', value: 'desatualizado', tone: 'warn' }
    case 'failed':
      return { key: 'embeddings', label: 'Embeddings', value: 'falhou', tone: 'danger' }
    case 'idle':
    default:
      return { key: 'embeddings', label: 'Embeddings', value: 'sem índice', tone: 'neutral' }
  }
}

function coveragePill(coverage: RepoHealthCardProps['coverage']): Pill {
  const measured = coverage.status === 'ok' || coverage.status === 'partial'
  if (!measured || coverage.percentage === undefined) {
    return { key: 'coverage', label: 'Cobertura', value: 'sem dados', tone: 'neutral' }
  }
  const pct = Math.round(coverage.percentage)
  const tone: Tone = pct >= 75 ? 'ok' : pct >= 50 ? 'warn' : 'danger'
  return { key: 'coverage', label: 'Cobertura', value: `${pct}%`, tone }
}

export function RepoHealthCard({ repo, embeddingsState, coverage }: RepoHealthCardProps) {
  const pills: Pill[] = [
    syncPill(repo.sync_status),
    analysisPill(repo.analysis_status),
    embeddingsPill(embeddingsState ?? repo.embeddings_state),
    coveragePill(coverage),
  ]

  const cardStyle: CSSProperties = {
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.card,
    padding: 14,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  }

  const sectionHeaderStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  }

  const sectionTitleStyle: CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    color: T.ink,
  }

  const gridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 8,
  }

  const pillStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 10px',
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.button,
    background: T.surfaceAlt,
    fontSize: 12,
    color: T.ink2,
    minWidth: 0,
  }

  const dotStyle = (tone: Tone): CSSProperties => ({
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: TONE_COLORS[tone],
    flexShrink: 0,
  })

  return (
    <section style={cardStyle} aria-label="Saúde do repositório">
      <div style={sectionHeaderStyle}>
        <MFIcon name="heart" size={14} color={T.accent} />
        <span style={sectionTitleStyle}>Saúde do repositório</span>
      </div>
      <div style={gridStyle}>
        {pills.map((pill) => (
          <div
            key={pill.key}
            style={pillStyle}
            role="status"
            aria-label={`${pill.label}: ${pill.value}`}
          >
            <span style={dotStyle(pill.tone)} />
            <span style={{ fontWeight: 600, color: T.ink }}>{pill.label}</span>
            <span style={{ color: T.ink3, marginLeft: 'auto' }}>{pill.value}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
