import { CSSProperties } from 'react'
import { T } from '@/lib/tokens'
import { MFIcon } from '@/components/icons/MFIcon'
import { RepositoryResponse, RepositoryStats } from '@/lib/types/repository'

interface RepoHealthCardProps {
  repo: RepositoryResponse
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

// Coverage comes from the repository's CI upload, not from any analysis of
// ours. `has_coverage` false means nothing was ever uploaded — which reads very
// differently from a measured 0%.
function coveragePill(stats?: RepositoryStats): Pill {
  if (!stats?.has_coverage) {
    return { key: 'coverage', label: 'Coverage', value: 'não configurado', tone: 'neutral' }
  }
  if (stats.coverage_status === 'failed') {
    return { key: 'coverage', label: 'Coverage', value: 'relatório inválido', tone: 'danger' }
  }

  const pct = stats.test_coverage ?? 0
  const value = `${pct.toFixed(1)}%`
  const tone: Tone = pct >= 80 ? 'ok' : pct >= 50 ? 'warn' : 'danger'
  return { key: 'coverage', label: 'Coverage', value, tone }
}

export function RepoHealthCard({ repo }: RepoHealthCardProps) {
  const pills: Pill[] = [syncPill(repo.sync_status), coveragePill(repo.stats)]

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
