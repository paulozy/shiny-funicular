'use client'

import { CSSProperties, useState } from 'react'
import { T } from '@/lib/tokens'
import { timeAgo } from '@/lib/relative-time'
import { RepoProvider } from '@/lib/types/repository'
import {
  PullRequestDrawer,
  PullRequestDrawerTarget,
} from '@/components/pull-requests/PullRequestDrawer'

export interface ReviewQueueItem {
  repoId: string
  repoName: string
  /**
   * The repository's host. The queue spans the whole organization, so this
   * varies per row — which is why the drawer reads it off the target.
   */
  provider?: RepoProvider
  number: number
  title: string
  author: string
  updatedAt: string
  /**
   * Null when the provider did not report it. The list endpoint on GitHub does
   * not carry diff stats, so rendering a 0 here claimed "no files changed" for
   * every pull request in the queue.
   */
  additions: number | null
  deletions: number | null
  changedFiles: number | null
  draft: boolean
}

interface ReviewQueueProps {
  items: ReviewQueueItem[]
  /** Whether the viewer's role allows submitting a review verdict. */
  canReview?: boolean
}

/**
 * "Aguardando sua revisão" — the first thing the v3 home puts in front of
 * someone: the open pull requests across the organization, newest first.
 *
 * The backend has no per-reviewer filter (pull requests are only listed per
 * repository), so this is the org-wide open queue rather than "assigned to
 * me". `page.tsx` is what bounds the fan-out.
 */
export function ReviewQueue({ items, canReview = false }: ReviewQueueProps) {
  // Clicking a row opens the summary sheet rather than the full page: the
  // decision "is this mine to review now?" does not need the diff.
  const [target, setTarget] = useState<PullRequestDrawerTarget | null>(null)

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
  }

  const rowStyle: CSSProperties = {
    width: '100%',
    textAlign: 'left',
    font: 'inherit',
    color: 'inherit',
    background: 'none',
    border: 0,
    borderBottom: `1px solid ${T.neutral200}`,
    padding: '14px 18px',
    cursor: 'pointer',
    display: 'block',
  }

  return (
    <section style={cardStyle}>
      <div style={headerStyle}>
        <h2 style={{ fontSize: 16, margin: 0 }}>Aguardando sua revisão</h2>
        <span
          style={{
            background: T.accentBg,
            color: T.accent800,
            borderRadius: T.radius.tag,
            padding: '3px 9px',
            fontSize: 11,
          }}
        >
          {items.length}
        </span>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: T.faint }}>clique para abrir</span>
      </div>

      {items.length === 0 ? (
        <div style={{ padding: '26px 18px', fontSize: 13.5, color: T.faint }}>
          Nada aguardando você. A fila de revisão está limpa.
        </div>
      ) : (
        <div>
          {items.map((pr) => (
            <button
              key={`${pr.repoId}-${pr.number}`}
              type="button"
              style={rowStyle}
              onClick={() =>
                setTarget({
                  repoId: pr.repoId,
                  number: pr.number,
                  title: pr.title,
                  repoName: pr.repoName,
                  provider: pr.provider,
                })
              }
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: T.mono, fontSize: 12.5, color: T.faint }}>
                  #{pr.number}
                </span>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{pr.title}</span>
                <span style={{ flex: 1 }} />
                {pr.draft && (
                  <span style={{ fontSize: 12, color: T.faint }}>draft</span>
                )}
              </div>
              <div
                style={{
                  fontSize: 12.5,
                  color: T.faint,
                  marginTop: 5,
                  display: 'flex',
                  gap: 8,
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ fontFamily: T.mono }}>{pr.repoName}</span>
                <span>·</span>
                <span>{pr.author}</span>
                <span>·</span>
                <span>{timeAgo(pr.updatedAt)}</span>
                {/* Omitted entirely when unreported: the drawer fetches the
                    detail and shows the real numbers. */}
                {pr.changedFiles !== null && (
                  <>
                    <span>·</span>
                    <span>
                      {pr.changedFiles} arquivo{pr.changedFiles === 1 ? '' : 's'}{' '}
                      <span style={{ color: T.ok }}>+{pr.additions ?? 0}</span>{' '}
                      <span style={{ color: T.danger }}>−{pr.deletions ?? 0}</span>
                    </span>
                  </>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      <PullRequestDrawer
        target={target}
        onClose={() => setTarget(null)}
        canReview={canReview}
      />
    </section>
  )
}
