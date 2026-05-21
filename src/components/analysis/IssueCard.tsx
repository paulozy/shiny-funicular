'use client'

import { CSSProperties, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { T } from '@/lib/tokens'
import { buildSingleIssuePrompt } from '@/lib/fix-prompt'
import { CodeIssue } from '@/lib/types/analysis'
import { RepositoryResponse } from '@/lib/types/repository'
import { SeverityBadge } from './SeverityBadge'

interface IssueCardProps {
  issue: CodeIssue
  repo: RepositoryResponse
  analysisCreatedAt?: string | null
}

export function IssueCard({ issue, repo, analysisCreatedAt }: IssueCardProps) {
  const [showSuggestion, setShowSuggestion] = useState(false)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle')

  useEffect(() => {
    if (copyState === 'idle') return
    const id = setTimeout(() => setCopyState('idle'), 1500)
    return () => clearTimeout(id)
  }, [copyState])

  const handleSingleCopy = useCallback(async () => {
    try {
      const result = buildSingleIssuePrompt(repo, issue, analysisCreatedAt)
      await navigator.clipboard.writeText(result.text)
      setCopyState('copied')
    } catch {
      setCopyState('error')
    }
  }, [repo, issue, analysisCreatedAt])

  const repoId = repo.id

  const cardStyle: CSSProperties = {
    backgroundColor: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.card,
    padding: '18px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    boxShadow: '0 1px 0 rgba(0,0,0,.03)',
  }

  const metaRowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  }

  const categoryStyle: CSSProperties = {
    fontSize: 11,
    color: T.ink3,
    border: `1px solid ${T.border}`,
    background: T.surfaceAlt,
    borderRadius: T.radius.tag,
    padding: '1px 8px',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  }

  const titleStyle: CSSProperties = {
    fontSize: 15,
    fontWeight: 600,
    color: T.ink,
    margin: 0,
    lineHeight: 1.4,
  }

  const locationStyle: CSSProperties = {
    fontFamily: T.mono,
    fontSize: 12,
    color: T.ink2,
    textDecoration: 'none',
    background: T.surfaceAlt,
    border: `1px solid ${T.border}`,
    borderRadius: 4,
    padding: '3px 8px',
    alignSelf: 'flex-start',
  }

  const descriptionStyle: CSSProperties = {
    fontSize: 13,
    color: T.ink2,
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
    margin: 0,
  }

  const suggestionToggleStyle: CSSProperties = {
    appearance: 'none',
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.button,
    background: T.surface,
    color: T.ink2,
    padding: '5px 10px',
    font: '500 12px ' + T.font,
    cursor: 'pointer',
    alignSelf: 'flex-start',
    transition: 'background 120ms ease, border-color 120ms ease',
  }

  const suggestionStyle: CSSProperties = {
    background: T.surfaceAlt,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.card,
    padding: '12px 14px',
    fontSize: 12.5,
    color: T.ink,
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
  }

  const footerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    paddingTop: 10,
    borderTop: `1px dashed ${T.border}`,
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

  const copyBtnStyle: CSSProperties = {
    appearance: 'none',
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.button,
    background: T.surfaceAlt,
    color: T.ink3,
    padding: '4px 6px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    font: '500 11px ' + T.font,
    marginLeft: 'auto',
    position: 'relative',
  }

  const copyBtnLabel =
    copyState === 'copied'
      ? 'Copiado!'
      : copyState === 'error'
        ? 'Falhou — copie manualmente'
        : 'Copiar prompt de fix'

  return (
    <article style={cardStyle} aria-label={`Alerta: ${issue.title}`}>
      <div style={metaRowStyle}>
        <SeverityBadge severity={issue.severity} />
        {issue.category && <span style={categoryStyle}>{issue.category}</span>}
        <button
          type="button"
          onClick={handleSingleCopy}
          style={copyBtnStyle}
          aria-label={copyBtnLabel}
          title={copyBtnLabel}
        >
          <CopyGlyph />
          {copyState === 'copied' ? 'Copiado' : 'Prompt'}
        </button>
      </div>

      <h3 style={titleStyle}>{issue.title}</h3>

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

// Inline SVG so we don't depend on MFIcon (which doesn't ship a `copy`
// glyph). Two overlapping rounded squares — the universal "copy" affordance.
function CopyGlyph() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
      <rect x="5" y="5" width="9" height="9" rx="1.5" />
      <path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" />
    </svg>
  )
}
