'use client'

import { CSSProperties, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { RepositoryListResponse, RepositoryResponse } from '@/lib/types/repository'
import { openIssueCount } from '@/lib/repo-metrics'
import { timeAgo } from '@/lib/relative-time'
import { T } from '@/lib/tokens'
import { Segmented } from '@/components/ui/Segmented'

interface RepositoryPanelProps {
  repos: RepositoryListResponse
  /**
   * Shown instead of the generic empty line when the catalog is empty because
   * of the page's scope rather than because of this card's own filter.
   */
  emptyReason?: string
}

// The mockup's three, and only those: scoping by team is a page-level control
// (ScopeFilter), because it governs the review queue and the decisions too.
type Filter = 'all' | 'hot' | 'pending'

/**
 * A repository is "pending" when a human still owes it something: a failing
 * maturity check, or nobody accountable for it.
 */
export function isPending(repo: RepositoryResponse): boolean {
  return (repo.scorecard?.failing ?? 0) > 0 || !repo.owner_team
}

/** The failing checks, for the pendency tag's tooltip. */
function failingChecks(repo: RepositoryResponse): string {
  return (repo.scorecard?.verdicts ?? [])
    .filter((verdict) => verdict.status === 'fail')
    .map((verdict) => verdict.title)
    .join(' · ')
}

/**
 * The catalog as v3 draws it: one card, a segmented filter, and a row per
 * repository — name, provider, the pendency that needs attention, and the
 * counts underneath. Replaces the two-column card grid, which showed the same
 * data with twice the vertical space.
 */
export function RepositoryPanel({ repos, emptyReason }: RepositoryPanelProps) {
  const router = useRouter()
  const [filter, setFilter] = useState<Filter>('all')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const filtered = repos.repositories.filter((repo) => {
    if (filter === 'hot') return (repo.metadata?.pr_count ?? 0) > 0
    if (filter === 'pending') return isPending(repo)
    return true
  })

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  )

  const cardStyle: CSSProperties = {
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.card,
  }

  const headerStyle: CSSProperties = {
    padding: '16px 18px',
    borderBottom: `1px solid ${T.border}`,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  }

  const tagStyle = (tone: 'neutral' | 'accent' | 'accent2'): CSSProperties => ({
    fontSize: 11,
    padding: '3px 9px',
    borderRadius: T.radius.tag,
    background: tone === 'accent' ? T.accentBg : tone === 'accent2' ? T.accent2Bg : T.neutral100,
    color: tone === 'accent' ? T.accent800 : tone === 'accent2' ? T.accent2Ink : T.neutral800,
    whiteSpace: 'nowrap',
  })

  const menuItemStyle: CSSProperties = {
    textAlign: 'left',
    font: 'inherit',
    fontSize: 13,
    background: 'none',
    border: 0,
    padding: '7px 8px',
    borderRadius: T.radius.tag,
    cursor: 'pointer',
    color: T.ink,
    textDecoration: 'none',
    display: 'block',
    width: '100%',
  }

  return (
    <section style={cardStyle}>
      <div style={headerStyle}>
        <h2 style={{ fontSize: 16, margin: 0 }}>Repositórios</h2>
        <span style={{ flex: 1 }} />
        <Segmented
          name="repo-filter"
          ariaLabel="Filtrar repositórios"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'Todos' },
            { value: 'hot', label: 'Hot' },
            { value: 'pending', label: 'Pendências' },
          ]}
        />
      </div>

      <div>
        {sorted.map((repo) => {
          const prCount = repo.metadata?.pr_count ?? 0
          const issues = openIssueCount(repo.metadata)
          const failing = repo.scorecard?.failing ?? 0

          return (
            <div
              key={repo.id}
              className="repo-card"
              style={{ padding: '14px 18px', borderBottom: `1px solid ${T.neutral200}` }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span
                  aria-hidden="true"
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: prCount > 0 ? T.accent : T.accent2,
                    flexShrink: 0,
                  }}
                />
                <Link
                  href={`/code/repositories/${repo.id}`}
                  style={{
                    fontFamily: T.mono,
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: T.accent700,
                    textDecoration: 'none',
                  }}
                >
                  {repo.name}
                </Link>
                <span style={tagStyle('neutral')}>{repo.provider}</span>
                {failing > 0 && (
                  <span style={tagStyle('accent2')} title={failingChecks(repo)}>
                    {failing} pendência{failing === 1 ? '' : 's'}
                  </span>
                )}
                {prCount > 0 && <span style={tagStyle('accent')}>hot</span>}
                <span style={{ flex: 1 }} />
                <span style={{ fontSize: 11.5, color: T.faint }}>{timeAgo(repo.updated_at)}</span>
                <button
                  type="button"
                  onClick={() => setOpenMenuId((current) => (current === repo.id ? null : repo.id))}
                  aria-label={`Abrir menu de ${repo.name}`}
                  aria-expanded={openMenuId === repo.id}
                  style={{
                    font: 'inherit',
                    background: 'none',
                    border: `1px solid ${T.border}`,
                    borderRadius: T.radius.tag,
                    color: T.faint,
                    padding: '0 6px',
                    cursor: 'pointer',
                  }}
                >
                  ···
                </button>
              </div>

              {repo.description && (
                <div style={{ fontSize: 13, color: T.ink3, marginTop: 5 }}>{repo.description}</div>
              )}

              <div
                style={{
                  fontSize: 12.5,
                  color: T.faint,
                  marginTop: 6,
                  display: 'flex',
                  gap: 14,
                  flexWrap: 'wrap',
                }}
              >
                <span>{prCount === 0 ? 'nenhum PR aberto' : `${prCount} PRs abertos`}</span>
                <span>{issues === 0 ? 'sem issues' : `${issues} issues`}</span>
                <span>
                  {repo.owner_team ? `time ${repo.owner_team.name}` : 'sem time responsável'}
                </span>
              </div>

              {openMenuId === repo.id && (
                <div
                  role="menu"
                  style={{
                    marginTop: 10,
                    background: T.neutral100,
                    borderRadius: T.radius.tag,
                    padding: 6,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                  }}
                >
                  <button
                    type="button"
                    role="menuitem"
                    style={menuItemStyle}
                    onClick={() => router.push(`/code/repositories/${repo.id}`)}
                  >
                    Abrir repositório
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    style={menuItemStyle}
                    onClick={() => router.push(`/code/repositories/${repo.id}/settings`)}
                  >
                    Configurações
                  </button>
                </div>
              )}
            </div>
          )
        })}

        {sorted.length === 0 && (
          <div style={{ padding: '26px 18px', fontSize: 13.5, color: T.faint }}>
            {emptyReason && repos.repositories.length === 0
              ? emptyReason
              : 'Nenhum repositório neste filtro.'}
          </div>
        )}
      </div>

      <div style={{ padding: '12px 18px', fontSize: 12, color: T.faint }}>Ordenado por atividade</div>
    </section>
  )
}
