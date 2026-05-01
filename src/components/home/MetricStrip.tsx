import { CSSProperties } from 'react'
import { RepositoryListResponse } from '@/lib/types/repository'
import { T } from '@/lib/tokens'
import { MFIcon } from '@/components/icons/MFIcon'

interface MetricStripProps {
  repos: RepositoryListResponse
}

export function MetricStrip({ repos }: MetricStripProps) {
  const totalPRs = repos.repositories.reduce((sum, repo) => sum + (repo.metadata?.pr_count ?? 0), 0)
  const totalIssues = repos.repositories.reduce((sum, repo) => sum + (repo.metadata?.issue_count ?? 0), 0)

  const coverageValues = repos.repositories
    .map((repo) => repo.metadata?.test_coverage)
    .filter((val): val is number => val !== undefined && val !== null)

  const avgCoverage = coverageValues.length > 0 ? Math.round(coverageValues.reduce((a, b) => a + b, 0) / coverageValues.length) : null

  const metrics = [
    {
      k: 'Repositórios',
      v: repos.total.toString(),
      s: repos.repositories.length > 0 ? `${repos.repositories.length} carregados` : 'Nenhum',
      icon: 'code',
      tone: T.ink,
    },
    {
      k: 'PRs abertos',
      v: totalPRs.toString(),
      s: totalPRs > 0 ? `${Math.min(3, totalPRs)} aguardando você` : 'Nenhum',
      icon: 'pr',
      tone: T.ink,
    },
    {
      k: 'Alertas',
      v: totalIssues.toString(),
      s: totalIssues > 0 ? `${Math.min(2, totalIssues)} críticos` : 'Nenhum',
      icon: 'shield',
      tone: totalIssues > 0 ? T.danger : T.ink,
    },
    {
      k: 'Cobertura média',
      v: avgCoverage !== null ? `${avgCoverage}%` : '–',
      s: avgCoverage !== null ? `${avgCoverage > 80 ? '+' : ''}${avgCoverage - 80}% essa sem.` : 'Sem dados',
      icon: 'check',
      tone: T.ink,
    },
  ]

  const containerStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 12,
    marginBottom: 18,
  }

  const cardStyle: CSSProperties = {
    backgroundColor: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.card,
    padding: '12px 14px',
  }

  const labelStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: T.faint,
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  }

  const valueStyle: CSSProperties = {
    fontSize: 22,
    fontWeight: 600,
    marginTop: 4,
    letterSpacing: '-0.01em',
  }

  const subtitleStyle: CSSProperties = {
    fontSize: 11.5,
    color: T.ink3,
    marginTop: 2,
  }

  return (
    <div style={containerStyle}>
      {metrics.map((metric) => (
        <div key={metric.k} style={cardStyle}>
          <div style={labelStyle}>
            <MFIcon name={metric.icon} size={12} color={T.faint} />
            {metric.k}
          </div>
          <div style={{ ...valueStyle, color: metric.tone }}>{metric.v}</div>
          <div style={subtitleStyle}>{metric.s}</div>
        </div>
      ))}
    </div>
  )
}
