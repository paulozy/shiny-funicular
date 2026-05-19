'use client'

import { CSSProperties, useState } from 'react'
import Link from 'next/link'
import { T } from '@/lib/tokens'
import { CodeIssue } from '@/lib/types/analysis'
import { SeverityBadge } from './SeverityBadge'

interface IssueCardProps {
  issue: CodeIssue
  repoId: string
}

export function IssueCard({ issue, repoId }: IssueCardProps) {
  const [showSuggestion, setShowSuggestion] = useState(false)

  const cardStyle: CSSProperties = {
    backgroundColor: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.card,
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  }

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  }

  const titleStyle: CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    color: T.ink,
    margin: 0,
  }

  const categoryStyle: CSSProperties = {
    fontSize: 11,
    color: T.ink3,
    border: `1px solid ${T.border}`,
    background: T.surfaceAlt,
    borderRadius: T.radius.tag,
    padding: '1px 7px',
    fontWeight: 500,
  }

  const locationStyle: CSSProperties = {
    fontFamily: T.mono,
    fontSize: 12,
    color: T.ink2,
    textDecoration: 'none',
  }

  const descriptionStyle: CSSProperties = {
    fontSize: 13,
    color: T.ink2,
    lineHeight: 1.55,
    whiteSpace: 'pre-wrap',
  }

  const suggestionToggleStyle: CSSProperties = {
    appearance: 'none',
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.button,
    background: T.surface,
    color: T.ink2,
    padding: '4px 9px',
    font: '500 12px ' + T.font,
    cursor: 'pointer',
    alignSelf: 'flex-start',
  }

  const suggestionStyle: CSSProperties = {
    background: T.surfaceAlt,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.card,
    padding: '10px 12px',
    fontSize: 12.5,
    color: T.ink,
    lineHeight: 1.55,
    whiteSpace: 'pre-wrap',
  }

  const footerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginTop: 2,
    fontSize: 11,
    color: T.faint,
  }

  const filesHref = issue.file
    ? `/code/repositories/${repoId}/files?path=${encodeURIComponent(issue.file)}`
    : null

  const locationLabel = issue.file
    ? issue.line && issue.line > 0
      ? `${issue.file}:${issue.line}`
      : issue.file
    : 'Sem caminho de arquivo'

  const confidencePercent = Math.round((issue.confidence ?? 0) * 100)

  return (
    <article style={cardStyle} aria-label={`Alerta: ${issue.title}`}>
      <div style={headerStyle}>
        <SeverityBadge severity={issue.severity} />
        {issue.category && <span style={categoryStyle}>{issue.category}</span>}
        <h3 style={titleStyle}>{issue.title}</h3>
      </div>

      {filesHref ? (
        <Link href={filesHref} style={locationStyle}>
          {locationLabel}
        </Link>
      ) : (
        <span style={{ ...locationStyle, color: T.faint }}>{locationLabel}</span>
      )}

      {issue.description && <p style={descriptionStyle}>{issue.description}</p>}

      {issue.suggestion && (
        <>
          <button
            type="button"
            style={suggestionToggleStyle}
            onClick={() => setShowSuggestion((v) => !v)}
            aria-expanded={showSuggestion}
          >
            {showSuggestion ? 'Ocultar sugestão' : 'Ver sugestão'}
          </button>
          {showSuggestion && <div style={suggestionStyle}>{issue.suggestion}</div>}
        </>
      )}

      <div style={footerStyle}>
        <span>{issue.is_ai_generated ? 'IA' : 'Regra determinística'}</span>
        {confidencePercent > 0 && <span>{confidencePercent}% confiança</span>}
        {issue.cwe_id && <span>{issue.cwe_id}</span>}
        {issue.owasp_category && <span>{issue.owasp_category}</span>}
      </div>
    </article>
  )
}
