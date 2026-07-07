'use client'

import { CSSProperties } from 'react'
import { T } from '@/lib/tokens'
import { CodeIssue } from '@/lib/types/pull_request'
import { severityMeta } from '@/lib/severity'

interface FindingCardProps {
  issue: CodeIssue
  /** Show the `file:line` location. Off when the card is anchored inline in a diff. */
  showLocation?: boolean
}

export function FindingCard({ issue, showLocation = true }: FindingCardProps) {
  const meta = severityMeta(issue.severity)

  const style: CSSProperties = {
    border: `1px solid ${T.border}`,
    borderLeft: `3px solid ${meta.color}`,
    borderRadius: 6,
    padding: '10px 12px',
    background: T.surface,
  }

  return (
    <div style={style}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, color: meta.color }}>
          {meta.label}
        </span>
        {showLocation && issue.file && (
          <span style={{ fontFamily: T.mono, fontSize: 11.5, color: T.ink3 }}>
            {issue.file}{issue.line ? `:${issue.line}` : ''}
          </span>
        )}
        {issue.category && <span style={{ fontSize: 11, color: T.faint }}>{issue.category}</span>}
      </div>
      <div style={{ marginTop: 5, fontSize: 13, fontWeight: 600, color: T.ink }}>{issue.title}</div>
      {issue.description && (
        <div style={{ marginTop: 3, fontSize: 12.5, color: T.ink3, lineHeight: 1.5 }}>{issue.description}</div>
      )}
      {issue.suggestion && (
        <div style={{ marginTop: 8, fontSize: 12, color: T.ink2, background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 4, padding: '7px 9px' }}>
          <span style={{ fontWeight: 600 }}>Sugestão: </span>{issue.suggestion}
        </div>
      )}
    </div>
  )
}
