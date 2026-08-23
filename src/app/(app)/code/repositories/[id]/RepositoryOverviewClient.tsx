'use client'

import { Alert } from '@/components/ui/Alert'
import { Tag } from '@/components/ui/Tag'
import { ProjectStackCard } from '@/components/repository/ProjectStackCard'
import { RepoHealthCard } from '@/components/repository/RepoHealthCard'
import { ScorecardCard } from '@/components/repository/ScorecardCard'
import { openIssueCount } from '@/lib/repo-metrics'
import { T } from '@/lib/tokens'
import { RepositoryResponse } from '@/lib/types/repository'
import { apiFetch } from '@/lib/api/client'
import Link from 'next/link'
import { CSSProperties, useEffect } from 'react'

interface RepositoryOverviewClientProps {
  repo: RepositoryResponse
  /**
   * Whether the viewer's role may trigger a sync. Without this the background
   * re-sync below would fire a request the API answers with 403 on every page
   * load for read-only members.
   */
  canSync?: boolean
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
  const issueCount = openIssueCount(metadata)
  const scorecard = repo.scorecard

  // The four numbers v3 puts at the top of a repository: what is moving, what
  // is open, who touches it, and whether it passes the maturity checks.
  const tiles: Array<{ label: string; value: string | number; href?: string }> = [
    {
      label: 'PRs abertos',
      value: metadata.pr_count ?? 0,
      href: `/code/repositories/${repo.id}/pull-requests`,
    },
    { label: 'Issues', value: issueCount },
    { label: 'Contribuidores', value: metadata.contributors ?? '—' },
    {
      label: 'Conformidade',
      value: scorecard ? `${scorecard.passing}/${scorecard.total}` : '—',
    },
  ]

  const operation: Array<[string, string | number]> = [
    ['Commits', metadata.commit_count ?? '—'],
    ['Branches', metadata.branch_count ?? '—'],
    ['Stars', metadata.star_count ?? '—'],
    ['Forks', metadata.fork_count ?? '—'],
  ]

  const cardStyle: CSSProperties = {
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.card,
    padding: 20,
  }

  const tileStyle: CSSProperties = {
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.card,
    padding: 16,
    textDecoration: 'none',
    color: 'inherit',
    display: 'block',
  }

  const tileLabelStyle: CSSProperties = {
    fontSize: 11.5,
    letterSpacing: '.07em',
    textTransform: 'uppercase',
    color: T.faint,
  }

  const tileValueStyle: CSSProperties = {
    fontSize: 26,
    fontWeight: 600,
    marginTop: 6,
  }

  const rowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'baseline',
    gap: 10,
    fontSize: 13.5,
    padding: '8px 0',
    borderBottom: `1px solid ${T.neutral200}`,
  }

  return (
    <div>
      {repo.sync_status === 'error' && repo.sync_error && (
        <div style={{ marginBottom: 18 }}>
          <Alert variant="danger">
            <strong>Falha ao sincronizar:</strong> {repo.sync_error}. A sincronização será
            tentada novamente automaticamente na próxima inicialização do servidor.
          </Alert>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 14,
          marginBottom: 22,
        }}
      >
        {tiles.map((tile) =>
          tile.href ? (
            <Link
              key={tile.label}
              href={tile.href}
              className="metric-link"
              style={tileStyle}
              aria-label={`Ver ${tile.label.toLowerCase()}`}
            >
              <div style={tileLabelStyle}>{tile.label}</div>
              <div style={tileValueStyle}>{tile.value}</div>
            </Link>
          ) : (
            <div key={tile.label} style={tileStyle}>
              <div style={tileLabelStyle}>{tile.label}</div>
              <div style={tileValueStyle}>{tile.value}</div>
            </div>
          )
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 0.85fr)',
          gap: 22,
          alignItems: 'start',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <ProjectStackCard
            languages={metadata.languages}
            frameworks={metadata.frameworks}
            topics={metadata.topics}
          />
          <ScorecardCard scorecard={repo.scorecard} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <RepoHealthCard repo={repo} />

          <section style={cardStyle}>
            <h2 style={{ fontSize: 16, margin: '0 0 12px' }}>Operação</h2>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {operation.map(([label, value]) => (
                <div key={label} style={rowStyle}>
                  <span style={{ color: T.faint }}>{label}</span>
                  <span style={{ flex: 1 }} />
                  <span>{value}</span>
                </div>
              ))}
              <div style={rowStyle}>
                <span style={{ color: T.faint }}>CI</span>
                <span style={{ flex: 1 }} />
                {/* Three states, not two: an absent signal means sync never
                    determined it, which is not the same as "there is no CI". */}
                {metadata.has_ci === undefined ? (
                  <Tag variant="default">Não verificado</Tag>
                ) : (
                  <span title={metadata.ci_evidence}>
                    <Tag variant={metadata.has_ci ? 'ok' : 'warn'}>
                      {metadata.has_ci ? 'Configurado' : 'Não encontrado'}
                    </Tag>
                  </span>
                )}
              </div>
              <div style={{ ...rowStyle, borderBottom: 0 }}>
                <span style={{ color: T.faint }}>Testes</span>
                <span style={{ flex: 1 }} />
                {metadata.has_tests === undefined ? (
                  <Tag variant="default">Não verificado</Tag>
                ) : (
                  <span title={metadata.test_evidence}>
                    <Tag variant={metadata.has_tests ? 'ok' : 'warn'}>
                      {metadata.has_tests ? 'Detectados' : 'Não encontrados'}
                    </Tag>
                  </span>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
