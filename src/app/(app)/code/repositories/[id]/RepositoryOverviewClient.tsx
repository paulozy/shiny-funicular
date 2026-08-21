'use client'

import { MFIcon } from '@/components/icons/MFIcon'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Tag } from '@/components/ui/Tag'
import { ProjectStackCard } from '@/components/repository/ProjectStackCard'
import { RepoHealthCard } from '@/components/repository/RepoHealthCard'
import { syncStatusLabel, syncStatusVariant } from '@/lib/coverage'
import { openIssueCount } from '@/lib/repo-metrics'
import { T } from '@/lib/tokens'
import { RepositoryResponse } from '@/lib/types/repository'
import { apiFetch } from '@/lib/api/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CSSProperties, useCallback, useEffect, useState } from 'react'

interface RepositoryOverviewClientProps {
  repo: RepositoryResponse
  /**
   * Whether the viewer's role may trigger a sync. Without this the background
   * re-sync below would fire a request the API answers with 403 on every page
   * load for read-only members.
   */
  canSync?: boolean
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString('pt-BR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function RepositoryOverviewClient({ repo, canSync = false }: RepositoryOverviewClientProps) {
  // Kick a throttled background re-sync when the repo is opened so metadata
  // (open PR/issue counts, stars, branches, …) converges after PRs are
  // merged/closed. Fire-and-forget — the backend throttles repeated calls.
  useEffect(() => {
    if (!canSync) return
    apiFetch(`/api/repositories/${repo.id}/sync`, { method: 'POST' }).catch(() => {})
  }, [repo.id, canSync])

  const metadata = repo.metadata || {}
  const branch = metadata.default_branch || 'main'
  const settingsHref = `/code/repositories/${repo.id}/settings`

  const issueCount = openIssueCount(metadata)

  // Activity/metadata signals that always exist from the GitHub sync — no AI
  // analysis required. These replace the removed quality score / analysis tiles.
  const metrics = [
    { label: 'PRs abertos', value: metadata.pr_count ?? 0, icon: 'pr', tone: T.ink, href: `/code/repositories/${repo.id}/pull-requests` },
    { label: 'Issues', value: issueCount, icon: 'shield', tone: issueCount > 0 ? T.danger : T.ink },
    { label: 'Contribuidores', value: metadata.contributors ?? '-', icon: 'user', tone: T.ink },
  ]

  const secondaryMetrics = [
    ['Commits', metadata.commit_count ?? '-'],
    ['Branches', metadata.branch_count ?? '-'],
    ['Stars', metadata.star_count ?? '-'],
    ['Forks', metadata.fork_count ?? '-'],
  ]

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
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 12,
    marginBottom: 14,
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
    gridTemplateColumns: '1fr 1fr',
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

      <div style={metricGridStyle}>
        {metrics.map((metric) => {
          const href = (metric as { href?: string }).href
          const inner = (
            <>
              <div style={metricLabelStyle}>
                <MFIcon name={metric.icon} size={12} color={T.faint} />
                {metric.label}
              </div>
              <div style={{ ...metricValueStyle, color: metric.tone }}>{metric.value}</div>
            </>
          )
          if (href) {
            return (
              <Link
                key={metric.label}
                href={href}
                className="metric-link"
                style={{ ...cardStyle, position: 'relative' }}
                aria-label={`Ver ${metric.label.toLowerCase()}`}
              >
                {inner}
                <span
                  className="metric-link__chevron"
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    display: 'inline-flex',
                    alignItems: 'center',
                    color: T.faint,
                  }}
                >
                  <MFIcon name="arrow-right" size={13} color="currentColor" />
                </span>
              </Link>
            )
          }
          return (
            <div key={metric.label} style={cardStyle}>
              {inner}
            </div>
          )
        })}
      </div>

      <div style={twoColumnStyle}>
        <ProjectStackCard
          languages={metadata.languages}
          frameworks={metadata.frameworks}
          topics={metadata.topics}
        />
        <RepoHealthCard repo={repo} />
      </div>

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
  )
}
