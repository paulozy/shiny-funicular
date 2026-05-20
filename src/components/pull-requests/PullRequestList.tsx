'use client'

import { CSSProperties, useMemo } from 'react'
import { T } from '@/lib/tokens'
import { PullRequestListItemResponse } from '@/lib/types/pull_request'
import { PullRequestCard } from './PullRequestCard'

interface PullRequestListProps {
  items: PullRequestListItemResponse[]
}

export function PullRequestList({ items }: PullRequestListProps) {
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

  return (
    <div>
      {open.length > 0 && (
        <section style={sectionStyle} aria-label="PRs abertos">
          <h2 style={groupHeaderStyle}>Abertos ({open.length})</h2>
          <div style={listStyle}>
            {open.map((item) => (
              <PullRequestCard key={item.pull_request.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {drafts.length > 0 && (
        <section style={sectionStyle} aria-label="PRs draft">
          <h2 style={groupHeaderStyle}>Drafts ({drafts.length})</h2>
          <div style={listStyle}>
            {drafts.map((item) => (
              <PullRequestCard key={item.pull_request.id} item={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
