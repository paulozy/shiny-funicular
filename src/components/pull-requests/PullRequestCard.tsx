'use client'

import { CSSProperties } from 'react'
import { T } from '@/lib/tokens'
import { PullRequestListItemResponse } from '@/lib/types/pull_request'

interface PullRequestCardProps {
  item: PullRequestListItemResponse
}

export function PullRequestCard({ item }: PullRequestCardProps) {
  const { pull_request: pr, latest_analysis: analysis } = item

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

  const analysisRowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    paddingTop: 10,
    borderTop: `1px dashed ${T.border}`,
    fontSize: 12,
    color: T.ink2,
    flexWrap: 'wrap',
  }

  const criticalCount = analysis?.critical_count ?? 0
  const errorCount = analysis?.error_count ?? 0
  const warningCount = analysis?.warning_count ?? 0

  return (
    <article style={cardStyle} aria-label={`Pull request ${pr.number}: ${pr.title}`}>
      <div style={headerStyle}>
        <span style={numberStyle}>#{pr.number}</span>
        <a
          href={pr.html_url}
          target="_blank"
          rel="noopener noreferrer"
          style={titleStyle}
          title={pr.title}
        >
          {pr.title}
        </a>
        {pr.draft ? (
          <span style={draftTagStyle}>Draft</span>
        ) : (
          <span style={tagStyle}>Open</span>
        )}
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

      {analysis && (
        <div style={analysisRowStyle}>
          <span style={{ color: T.ink3, fontWeight: 600 }}>Análise da PR:</span>
          {criticalCount > 0 && (
            <span style={{ color: T.danger, fontWeight: 600 }}>
              {criticalCount} críticos
            </span>
          )}
          {errorCount > 0 && (
            <span style={{ color: T.danger }}>{errorCount} erros</span>
          )}
          {warningCount > 0 && (
            <span style={{ color: T.warn }}>{warningCount} avisos</span>
          )}
          {analysis.issue_count === 0 && (
            <span style={{ color: T.ok }}>nenhum alerta</span>
          )}
        </div>
      )}
    </article>
  )
}
