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
    padding: '13px 15px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  }

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  }

  const numberStyle: CSSProperties = {
    fontFamily: T.mono,
    fontSize: 12.5,
    color: T.faint,
    fontWeight: 500,
  }

  const titleStyle: CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    color: T.ink,
    textDecoration: 'none',
    margin: 0,
  }

  const tagStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '1px 7px',
    borderRadius: T.radius.tag,
    border: `1px solid ${T.border}`,
    background: T.surfaceAlt,
    fontSize: 11,
    color: T.ink2,
    fontWeight: 500,
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
    gap: 6,
    fontFamily: T.mono,
    fontSize: 11.5,
    color: T.ink2,
    flexWrap: 'wrap',
  }

  const metricsStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    fontSize: 11.5,
    color: T.ink3,
    flexWrap: 'wrap',
  }

  const analysisRowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    paddingTop: 8,
    borderTop: `1px dashed ${T.border}`,
    fontSize: 12,
    color: T.ink2,
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
        >
          {pr.title}
        </a>
        {pr.draft && <span style={draftTagStyle}>Draft</span>}
        {!pr.draft && <span style={tagStyle}>Open</span>}
      </div>

      <div style={branchesStyle}>
        <span>{pr.author_login}</span>
        <span style={{ color: T.faint }}>·</span>
        <span>
          {pr.head_branch} → {pr.base_branch}
        </span>
      </div>

      <div style={metricsStyle}>
        <span style={{ color: T.ok }}>+{pr.additions_count}</span>
        <span style={{ color: T.danger }}>-{pr.deletions_count}</span>
        <span>{pr.changed_files} arquivos</span>
        <span>{pr.commits_count} commits</span>
        <span style={{ color: T.faint }}>
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
          <span>Análise da PR:</span>
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
