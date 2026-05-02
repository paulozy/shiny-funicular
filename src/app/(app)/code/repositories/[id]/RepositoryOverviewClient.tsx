'use client'

import { MFIcon } from '@/components/icons/MFIcon'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Tag } from '@/components/ui/Tag'
import { analysisStatusLabel, analysisStatusTone, analysisStatusVariant, getRepositoryStats, qualityTone } from '@/lib/repository-analysis'
import {
  coverageStatusLabel,
  coverageStatusVariant,
  coverageWasMeasured,
  syncStatusLabel,
  syncStatusVariant,
} from '@/lib/coverage'
import { T } from '@/lib/tokens'
import { CoverageStatus, RepositoryResponse } from '@/lib/types/repository'
import Link from 'next/link'
import { CSSProperties } from 'react'

interface RepositoryOverviewClientProps {
  repo: RepositoryResponse
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString('pt-BR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatNullableDate(value?: string | null): string {
  if (!value) return 'Nunca analisado'
  return formatDate(value)
}

function metricTone(kind: string, value?: number): string {
  if (kind === 'alerts' && value && value > 0) return T.danger
  if (kind === 'coverage') {
    if (value === undefined) return T.ink
    if (value < 60) return T.danger
    if (value < 80) return T.warn
    return T.ok
  }
  return T.ink
}

function pickCoverage(repo: RepositoryResponse): {
  percentage?: number
  status: CoverageStatus | '' | undefined
} {
  // Prefer the authoritative value from the latest analysis (`stats`); fall
  // back to the legacy `metadata.test_coverage` populated by the sync. When
  // we only have a number without an explicit status, we still treat it as
  // measured so legacy data keeps rendering as a percentage.
  const statsCoverage = repo.stats?.test_coverage
  const statsStatus = repo.stats?.coverage_status
  if (statsStatus === 'ok' || statsStatus === 'partial') {
    return { percentage: statsCoverage, status: statsStatus }
  }
  const metaCoverage = repo.metadata?.test_coverage
  const metaStatus = repo.metadata?.coverage_status
  if (typeof metaCoverage === 'number' && metaCoverage > 0) {
    return { percentage: metaCoverage, status: metaStatus ?? 'ok' }
  }
  return { percentage: metaCoverage, status: metaStatus ?? statsStatus ?? '' }
}

export function RepositoryOverviewClient({ repo }: RepositoryOverviewClientProps) {
  const metadata = repo.metadata || {}
  const branch = metadata.default_branch || 'main'
  const stats = getRepositoryStats(repo)
  const searchHref = `/code/repositories/${repo.id}/search?branch=${encodeURIComponent(branch)}`
  const settingsHref = `/code/repositories/${repo.id}/settings`
  const languageEntries = Object.entries(metadata.languages || {}).sort((a, b) => b[1] - a[1])
  const languageTotal = languageEntries.reduce((sum, [, value]) => sum + value, 0)

  const metrics = [
    {
      label: 'Qualidade',
      value: stats.has_analysis ? `${Math.round(stats.latest_quality_score)}/100` : 'Sem análise',
      icon: 'trophy',
      tone: stats.has_analysis ? qualityTone(stats.latest_quality_score, T) : T.ink3,
    },
    { label: 'Status análise', value: analysisStatusLabel(repo.analysis_status), icon: 'database', tone: analysisStatusTone(repo.analysis_status, T) },
    { label: 'Reviews', value: repo.reviews_count ?? 0, icon: 'check', tone: T.ink },
    { label: 'Análises', value: stats.total_analyses, icon: 'doc', tone: T.ink },
  ]

  const coverage = pickCoverage(repo)
  const coverageMeasured = coverageWasMeasured(coverage.status)

  const qualitySupportMetrics = [
    { label: 'PRs abertos', value: metadata.pr_count ?? 0, icon: 'pr', tone: metricTone('prs', metadata.pr_count) },
    { label: 'Alertas', value: metadata.issue_count ?? 0, icon: 'shield', tone: metricTone('alerts', metadata.issue_count) },
    {
      label: 'Cobertura',
      value: coverageMeasured && coverage.percentage !== undefined
        ? `${Math.round(coverage.percentage)}%`
        : '—',
      icon: 'check',
      tone: coverageMeasured ? metricTone('coverage', coverage.percentage) : T.ink3,
      coverageBadge: coverage.status as CoverageStatus | '' | undefined,
    },
    { label: 'Contribuidores', value: metadata.contributors ?? '-', icon: 'user', tone: T.ink },
  ]

  const secondaryMetrics = [
    ['Última análise', formatNullableDate(stats.last_analyzed_at)],
    ['Commits', metadata.commit_count ?? '-'],
    ['Branches', metadata.branch_count ?? '-'],
    ['Stars', metadata.star_count ?? '-'],
    ['Forks', metadata.fork_count ?? '-'],
  ]

  const nextActions = [
    ...(!stats.has_analysis
      ? [{
        title: 'Analisar repositório',
        description: 'Este repositório ainda não tem análise de qualidade. Configure ou rode uma análise para preencher score, reviews e histórico.',
        href: settingsHref,
        label: 'Configurar',
        icon: 'database',
      }]
      : []),
    ...(repo.analysis_status === 'failed'
      ? [{
        title: 'Revisar falha de análise',
        description: 'A última análise falhou. Verifique configurações e credenciais antes de tentar novamente.',
        href: settingsHref,
        label: 'Ver ajustes',
        icon: 'x',
      }]
      : []),
    ...(metadata.issue_count && metadata.issue_count > 0
      ? [{
        title: 'Revisar alertas',
        description: `${metadata.issue_count} alerta${metadata.issue_count !== 1 ? 's' : ''} detectado${metadata.issue_count !== 1 ? 's' : ''} neste repositório.`,
        href: `${searchHref}&q=alertas%20seguran%C3%A7a`,
        label: 'Abrir busca',
        icon: 'shield',
      }]
      : []),
    ...(metadata.test_coverage === undefined || metadata.test_coverage < 60
      ? [{
        title: 'Melhorar cobertura',
        description: metadata.test_coverage === undefined ? 'Cobertura ainda não detectada nos metadados.' : `Cobertura em ${Math.round(metadata.test_coverage)}%.`,
        href: `${searchHref}&q=testes`,
        label: 'Buscar testes',
        icon: 'check',
      }]
      : []),
    {
      title: 'Gerar índice semântico',
      description: 'Atualize embeddings para melhorar a busca por intenção neste repositório.',
      href: settingsHref,
      label: 'Configurações',
      icon: 'database',
    },
  ].slice(0, 3)

  const pageStyle: CSSProperties = {
    padding: '20px 24px 28px',
  }

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 18,
  }

  const iconBoxStyle: CSSProperties = {
    width: 42,
    height: 42,
    borderRadius: 10,
    background: T.accentBg,
    border: `1px solid ${T.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  }

  const titleStyle: CSSProperties = {
    margin: 0,
    fontSize: 22,
    fontWeight: 600,
    color: T.ink,
  }

  const subtitleStyle: CSSProperties = {
    marginTop: 4,
    fontSize: 12.5,
    color: T.ink3,
    lineHeight: 1.5,
  }

  const actionRowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  }

  const metricGridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: 12,
    marginBottom: 14,
  }

  const analysisBannerStyle: CSSProperties = {
    border: `1px solid ${stats.has_analysis ? T.border : T.warnBorder}`,
    background: stats.has_analysis ? T.surface : T.warnBg,
    borderRadius: T.radius.card,
    padding: 12,
    marginBottom: 14,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    color: stats.has_analysis ? T.ink : T.warn,
  }

  const cardStyle: CSSProperties = {
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.card,
    padding: 14,
  }

  const metricLabelStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    fontSize: 10.5,
    fontWeight: 600,
    color: T.faint,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  }

  const metricValueStyle: CSSProperties = {
    marginTop: 6,
    fontSize: 24,
    fontWeight: 650,
    letterSpacing: 0,
  }

  const twoColumnStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1.25fr 1fr',
    gap: 14,
    marginBottom: 14,
  }

  const sectionHeaderStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  }

  const sectionTitleStyle: CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    color: T.ink,
  }

  const rowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: '7px 0',
    borderBottom: `1px dashed ${T.border}`,
    fontSize: 12.5,
  }

  const linkButtonStyle: CSSProperties = {
    textDecoration: 'none',
  }

  return (
    <div style={pageStyle}>
      {repo.sync_status === 'error' && repo.sync_error && (
        <div style={{ marginBottom: 14 }}>
          <Alert variant="danger">
            <strong>Falha ao sincronizar:</strong> {repo.sync_error}. A sincronização será
            tentada novamente automaticamente na próxima inicialização do servidor.
          </Alert>
        </div>
      )}
      <div style={headerStyle}>
        <div style={iconBoxStyle}>
          <MFIcon name="branch" size={20} color={T.accent} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h1 style={titleStyle}>{repo.name}</h1>
            <Tag>{repo.provider}</Tag>
            <Tag variant={repo.is_private ? 'warn' : 'ok'}>{repo.is_private ? 'privado' : 'público'}</Tag>
            <Tag variant={syncStatusVariant(repo.sync_status)}>{syncStatusLabel(repo.sync_status)}</Tag>
            <Tag variant={analysisStatusVariant(repo.analysis_status)}>{analysisStatusLabel(repo.analysis_status)}</Tag>
          </div>
          <div style={subtitleStyle}>
            <span style={{ fontFamily: T.mono }}>{repo.full_name}</span>
            {repo.description && <span> · {repo.description}</span>}
          </div>
          <div style={{ ...subtitleStyle, marginTop: 6 }}>
            Branch <span style={{ fontFamily: T.mono }}>{branch}</span> · atualizado {formatDate(repo.updated_at)}
          </div>
        </div>
        <div style={actionRowStyle}>
          <Link href={searchHref} style={linkButtonStyle}>
            <Button variant="primary" size="md">
              <MFIcon name="search" size={13} />
              Buscar no repositório
            </Button>
          </Link>
          <Link href={settingsHref} style={linkButtonStyle}>
            <Button variant="default" size="md">
              <MFIcon name="gear" size={13} />
              Configurações
            </Button>
          </Link>
          {repo.url && (
            <a href={repo.url} target="_blank" rel="noreferrer" style={linkButtonStyle}>
              <Button variant="default" size="md">
                <MFIcon name="arrow-right" size={13} />
                Abrir origem
              </Button>
            </a>
          )}
        </div>
      </div>

      <div style={analysisBannerStyle}>
        <MFIcon name={stats.has_analysis ? 'trophy' : 'database'} size={14} color="currentColor" />
        <div style={{ fontSize: 12.5, lineHeight: 1.45 }}>
          {stats.has_analysis
            ? <>Última análise em <span style={{ fontFamily: T.mono }}>{formatNullableDate(stats.last_analyzed_at)}</span>.</>
            : 'Repositório ainda sem análise. O score 0 do backend está sendo tratado como estado vazio, não como baixa qualidade.'}
        </div>
      </div>

      <div style={metricGridStyle}>
        {metrics.map((metric) => (
          <div key={metric.label} style={cardStyle}>
            <div style={metricLabelStyle}>
              <MFIcon name={metric.icon} size={12} color={T.faint} />
              {metric.label}
            </div>
            <div style={{ ...metricValueStyle, color: metric.tone }}>{metric.value}</div>
          </div>
        ))}
      </div>

      <div style={{ ...metricGridStyle, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
        {qualitySupportMetrics.map((metric) => {
          const badge = (metric as { coverageBadge?: CoverageStatus | '' | undefined }).coverageBadge
          return (
            <div key={metric.label} style={cardStyle}>
              <div style={metricLabelStyle}>
                <MFIcon name={metric.icon} size={12} color={T.faint} />
                {metric.label}
              </div>
              <div style={{ ...metricValueStyle, color: metric.tone }}>{metric.value}</div>
              {badge !== undefined && metric.label === 'Cobertura' && (
                <div style={{ marginTop: 6 }}>
                  <Tag variant={coverageStatusVariant(badge)}>{coverageStatusLabel(badge)}</Tag>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div style={twoColumnStyle}>
        <section style={cardStyle}>
          <div style={sectionHeaderStyle}>
            <MFIcon name="code" size={14} color={T.accent} />
            <span style={sectionTitleStyle}>Linguagens</span>
          </div>
          {languageEntries.length === 0 ? (
            <div style={{ fontSize: 12.5, color: T.faint }}>Sem linguagens detectadas.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {languageEntries.map(([name, value]) => {
                const percent = languageTotal > 0 ? Math.round((value / languageTotal) * 100) : 0
                return (
                  <div key={name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
                      <span>{name}</span>
                      <span style={{ color: T.faint }}>{percent}%</span>
                    </div>
                    <div style={{ height: 7, borderRadius: 999, background: T.surfaceAlt, overflow: 'hidden' }}>
                      <div style={{ width: `${percent}%`, height: '100%', background: T.accent }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <section style={cardStyle}>
          <div style={sectionHeaderStyle}>
            <MFIcon name="flag" size={14} color={T.accent} />
            <span style={sectionTitleStyle}>Operação</span>
          </div>
          {secondaryMetrics.map(([label, value]) => (
            <div key={label} style={rowStyle}>
              <span style={{ color: T.faint }}>{label}</span>
              <span>{value}</span>
            </div>
          ))}
          <div style={rowStyle}>
            <span style={{ color: T.faint }}>CI</span>
            <Tag variant={metadata.has_ci ? 'ok' : 'warn'}>{metadata.has_ci ? 'Configurado' : 'Não detectado'}</Tag>
          </div>
          <div style={{ ...rowStyle, borderBottom: 0 }}>
            <span style={{ color: T.faint }}>Testes</span>
            <Tag variant={metadata.has_tests ? 'ok' : 'warn'}>{metadata.has_tests ? 'Detectados' : 'Não detectados'}</Tag>
          </div>
        </section>
      </div>

      <div style={twoColumnStyle}>
        <section style={cardStyle}>
          <div style={sectionHeaderStyle}>
            <MFIcon name="box" size={14} color={T.accent} />
            <span style={sectionTitleStyle}>Frameworks e tópicos</span>
          </div>
          {metadata.frameworks?.length || metadata.topics?.length ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {metadata.frameworks?.map((item) => <Tag key={`fw-${item}`} variant="accent">{item}</Tag>)}
              {metadata.topics?.map((item) => <Tag key={`topic-${item}`}>{item}</Tag>)}
            </div>
          ) : (
            <div style={{ fontSize: 12.5, color: T.faint }}>Sem frameworks ou tópicos detectados.</div>
          )}
        </section>

        <section style={cardStyle}>
          <div style={sectionHeaderStyle}>
            <MFIcon name="lightbulb" size={14} color={T.ai} />
            <span style={sectionTitleStyle}>Próximas ações</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {nextActions.map((action) => (
              <Link key={action.title} href={action.href} style={{ textDecoration: 'none' }}>
                <div style={{ border: `1px solid ${T.border}`, borderRadius: 6, padding: 10, color: T.ink }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 600 }}>
                    <MFIcon name={action.icon} size={12} color={T.accent} />
                    {action.title}
                    <span style={{ marginLeft: 'auto', color: T.accent, fontSize: 11.5 }}>{action.label}</span>
                  </div>
                  <div style={{ marginTop: 4, fontSize: 12, color: T.ink3, lineHeight: 1.4 }}>{action.description}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
