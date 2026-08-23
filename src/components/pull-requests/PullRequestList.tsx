'use client'

import { CSSProperties, useMemo } from 'react'
import { T } from '@/lib/tokens'
import { PullRequestListItemResponse } from '@/lib/types/pull_request'
import { PullRequestCard } from './PullRequestCard'

export type PullRequestFilter = 'open' | 'draft' | 'all'

interface PullRequestListProps {
  items: PullRequestListItemResponse[]
  repoId: string
  /**
   * When set, the list is flat and shows only the matching pull requests —
   * the segmented control above it is what names the group. Left unset the
   * list groups open PRs and drafts under their own headings.
   */
  filter?: PullRequestFilter
  /** Forwarded to each card: opens the review sheet instead of navigating. */
  onSelect?: (pr: PullRequestListItemResponse['pull_request']) => void
}

export function PullRequestList({ items, repoId, filter, onSelect }: PullRequestListProps) {
  const { open, drafts } = useMemo(() => {
    const sorted = [...items].sort(
      (a, b) =>
        new Date(b.pull_request.updated_at).getTime() -
        new Date(a.pull_request.updated_at).getTime()
    )
    return {
      open: sorted.filter((item) => !item.pull_request.draft),
      drafts: sorted.filter((item) => item.pull_request.draft),
    }
  }, [items])

  const groupHeaderStyle: CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: T.ink3,
    margin: '0 0 8px',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  }

  const sectionStyle: CSSProperties = {
    marginBottom: 20,
  }

  const listStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  }

  const emptyStyle: CSSProperties = {
    padding: 24,
    textAlign: 'center',
    color: T.faint,
    fontSize: 13,
    border: `1px dashed ${T.border}`,
    borderRadius: T.radius.card,
    background: T.surfaceAlt,
  }

  if (items.length === 0) {
    return <div style={emptyStyle}>Nenhum PR aberto no momento.</div>
  }

  if (filter) {
    const visible = filter === 'open' ? open : filter === 'draft' ? drafts : [...open, ...drafts]
    if (visible.length === 0) {
      return <div style={emptyStyle}>Nenhum pull request neste filtro.</div>
    }
    return (
      <div style={listStyle}>
        {visible.map((item) => (
          <PullRequestCard
            key={item.pull_request.id}
            item={item}
            repoId={repoId}
            onSelect={onSelect}
          />
        ))}
      </div>
    )
  }

  return (
    <div>
      {open.length > 0 && (
        <section style={sectionStyle} aria-label="PRs abertos">
          <h2 style={groupHeaderStyle}>Abertos ({open.length})</h2>
          <div style={listStyle}>
            {open.map((item) => (
              <PullRequestCard
                key={item.pull_request.id}
                item={item}
                repoId={repoId}
                onSelect={onSelect}
              />
            ))}
          </div>
        </section>
      )}

      {drafts.length > 0 && (
        <section style={sectionStyle} aria-label="PRs draft">
          <h2 style={groupHeaderStyle}>Drafts ({drafts.length})</h2>
          <div style={listStyle}>
            {drafts.map((item) => (
              <PullRequestCard
                key={item.pull_request.id}
                item={item}
                repoId={repoId}
                onSelect={onSelect}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
