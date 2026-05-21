import { CSSProperties } from 'react'
import Link from 'next/link'
import { T } from '@/lib/tokens'
import { MFIcon } from '@/components/icons/MFIcon'
import { SeverityBadge } from '@/components/analysis/SeverityBadge'
import { stableKey } from '@/lib/stable-key'
import { CodeAnalysis, CodeIssue, SeverityLevel } from '@/lib/types/analysis'

interface CriticalIssuesCardProps {
  analysis: CodeAnalysis | null
  repoId: string
}

const CRITICAL_SEVERITIES: SeverityLevel[] = ['critical', 'error']
const MAX_ITEMS = 3

function daysSince(iso: string | undefined): number | null {
  if (!iso) return null
  const ts = new Date(iso).getTime()
  if (Number.isNaN(ts)) return null
  return Math.max(0, Math.floor((Date.now() - ts) / 86_400_000))
}

export function CriticalIssuesCard({ analysis, repoId }: CriticalIssuesCardProps) {
  const issuesHref = `/code/repositories/${repoId}/issues`

  const cardStyle: CSSProperties = {
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.card,
    padding: 14,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
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

  const verAllStyle: CSSProperties = {
    marginLeft: 'auto',
    fontSize: 12,
    color: T.ink3,
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
  }

  const emptyStyle: CSSProperties = {
    padding: '12px 0 4px',
    fontSize: 12.5,
    color: T.faint,
  }

  const listStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    margin: 0,
    padding: 0,
    listStyle: 'none',
  }

  const itemStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    padding: '8px 10px',
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.button,
    background: T.surfaceAlt,
    textDecoration: 'none',
    color: 'inherit',
    transition: 'background 120ms ease, border-color 120ms ease',
  }

  const itemTitleRowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  }

  const titleStyle: CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: T.ink,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
    flex: 1,
  }

  const locationStyle: CSSProperties = {
    fontFamily: T.mono,
    fontSize: 11.5,
    color: T.ink3,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }

  const verAllLink = (
    <Link href={issuesHref} style={verAllStyle} aria-label="Ver todos os alertas">
      Ver todos
      <MFIcon name="arrow-right" size={12} color="currentColor" />
    </Link>
  )

  if (!analysis) {
    return (
      <section style={cardStyle} aria-label="Alertas críticos">
        <div style={sectionHeaderStyle}>
          <MFIcon name="shield" size={14} color={T.danger} />
          <span style={sectionTitleStyle}>Alertas críticos</span>
        </div>
        <div style={emptyStyle}>
          Nenhuma análise concluída ainda. Inicie uma análise para detectar alertas.
        </div>
      </section>
    )
  }

  const critical: CodeIssue[] = (analysis.issues ?? [])
    .filter((issue) => CRITICAL_SEVERITIES.includes(issue.severity))
    .slice(0, MAX_ITEMS)

  return (
    <section style={cardStyle} aria-label="Alertas críticos">
      <div style={sectionHeaderStyle}>
        <MFIcon name="shield" size={14} color={T.danger} />
        <span style={sectionTitleStyle}>Alertas críticos</span>
        {verAllLink}
      </div>

      {critical.length === 0 ? (
        <div style={emptyStyle}>
          Sem alertas críticos
          {(() => {
            const days = daysSince(analysis.created_at)
            if (days === null) return '.'
            if (days === 0) return ' — análise rodou hoje.'
            return ` — última análise há ${days} dia${days === 1 ? '' : 's'}.`
          })()}
        </div>
      ) : (
        <ul style={listStyle}>
          {critical.map((issue, idx) => (
            <li key={stableKey([issue.id, issue.title, issue.file, issue.line], idx)}>
              <Link href={issuesHref} style={itemStyle}>
                <div style={itemTitleRowStyle}>
                  <SeverityBadge severity={issue.severity} size="compact" />
                  <span style={titleStyle} title={issue.title}>
                    {issue.title}
                  </span>
                </div>
                {issue.file && (
                  <span style={locationStyle}>
                    {issue.file}
                    {issue.line ? `:${issue.line}` : ''}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
