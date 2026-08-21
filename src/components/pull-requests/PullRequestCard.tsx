'use client'

import { CSSProperties } from 'react'
import Link from 'next/link'
import { T } from '@/lib/tokens'
import { MFIcon } from '@/components/icons/MFIcon'
import { PullRequestListItemResponse } from '@/lib/types/pull_request'

interface PullRequestCardProps {
  item: PullRequestListItemResponse
  repoId: string
}

export function PullRequestCard({ item, repoId }: PullRequestCardProps) {
  const { pull_request: pr } = item
  const detailHref = `/code/repositories/${repoId}/pull-requests/${pr.number}`

  const cardStyle: CSSProperties = {
    backgroundColor: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.card,
    padding: '16px 18px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    boxShadow: '0 1px 0 rgba(0,0,0,.03)',
  }

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'baseline',
    gap: 10,
    minWidth: 0,
  }

  const numberStyle: CSSProperties = {
    fontFamily: T.mono,
    fontSize: 12.5,
    color: T.faint,
    fontWeight: 500,
    flexShrink: 0,
  }

  const titleStyle: CSSProperties = {
    fontSize: 14.5,
    fontWeight: 600,
    color: T.ink,
    textDecoration: 'none',
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
    flex: 1,
    lineHeight: 1.4,
  }

  const tagStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '2px 8px',
    borderRadius: T.radius.tag,
    border: `1px solid ${T.border}`,
    background: T.surfaceAlt,
    fontSize: 10.5,
    color: T.ink2,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    flexShrink: 0,
  }

  const draftTagStyle: CSSProperties = {
    ...tagStyle,
    color: T.warn,
    borderColor: T.warnBorder,
    background: T.warnBg,
  }

  const branchesStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 12,
    color: T.ink3,
    flexWrap: 'wrap',
  }

  const branchPillStyle: CSSProperties = {
    fontFamily: T.mono,
    fontSize: 11.5,
    color: T.ink2,
    background: T.surfaceAlt,
    border: `1px solid ${T.border}`,
    borderRadius: 4,
    padding: '2px 7px',
  }

  const metricsStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 18,
    fontSize: 11.5,
    color: T.ink3,
    flexWrap: 'wrap',
    paddingTop: 10,
    borderTop: `1px dashed ${T.border}`,
  }

  const footerRowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    paddingTop: 10,
    borderTop: `1px dashed ${T.border}`,
    fontSize: 12,
    color: T.ink2,
    flexWrap: 'wrap',
  }

  return (
    <article style={cardStyle} aria-label={`Pull request ${pr.number}: ${pr.title}`}>
      <div style={headerStyle}>
        <span style={numberStyle}>#{pr.number}</span>
        <Link href={detailHref} style={titleStyle} title={pr.title}>
          {pr.title}
        </Link>
        {pr.draft ? (
          <span style={draftTagStyle}>Draft</span>
        ) : (
          <span style={tagStyle}>Open</span>
        )}
        <a
          href={pr.html_url}
          target="_blank"
          rel="noopener noreferrer"
          title="Abrir no GitHub"
          aria-label="Abrir no GitHub"
          style={{ display: 'inline-flex', alignItems: 'center', color: T.faint, flexShrink: 0 }}
        >
          <MFIcon name="arrow-right" size={13} color="currentColor" />
        </a>
      </div>

      <div style={branchesStyle}>
        <span>por {pr.author_login}</span>
        <span style={{ color: T.faint }}>·</span>
        <span style={branchPillStyle}>{pr.head_branch}</span>
        <span style={{ color: T.faint }}>→</span>
        <span style={branchPillStyle}>{pr.base_branch}</span>
      </div>

      <div style={metricsStyle}>
        <span style={{ color: T.ok, fontWeight: 600 }}>+{pr.additions_count}</span>
        <span style={{ color: T.danger, fontWeight: 600 }}>-{pr.deletions_count}</span>
        <span>{pr.changed_files} arquivos</span>
        <span>{pr.commits_count} commits</span>
        <span style={{ color: T.faint, marginLeft: 'auto' }}>
          atualizado{' '}
          {new Date(pr.updated_at).toLocaleString('pt-BR', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>

      <div style={footerRowStyle}>
        <Link href={detailHref} style={{ marginLeft: 'auto', color: T.accent, textDecoration: 'none', fontWeight: 600 }}>
          Ver alterações →
        </Link>
      </div>
    </article>
  )
}
