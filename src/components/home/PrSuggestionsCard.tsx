'use client'

import { CSSProperties, useState } from 'react'
import { T } from '@/lib/tokens'
import { MFIcon } from '@/components/icons/MFIcon'
import { CopyButton } from '@/components/ui/CopyButton'
import { CodeIssue } from '@/lib/types/pull_request'
import { severityMeta } from '@/lib/severity'
import { formatAllSuggestionsForCopy, formatSuggestionForCopy } from '@/lib/pr-review'

const visuallyHidden: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
}

const SUGGESTION_CLAMP = 180

function SuggestionItem({ issue, onCopied }: { issue: CodeIssue; onCopied: (msg: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  const meta = severityMeta(issue.severity)
  const suggestion = issue.suggestion ?? ''
  const isLong = suggestion.length > SUGGESTION_CLAMP
  const shown = isLong && !expanded ? `${suggestion.slice(0, SUGGESTION_CLAMP)}…` : suggestion

  const itemStyle: CSSProperties = {
    border: `1px solid ${T.border}`,
    borderLeft: `3px solid ${meta.color}`,
    borderRadius: 6,
    padding: '8px 10px',
    background: T.surface,
  }

  return (
    <div style={itemStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, color: meta.color }}>
          {meta.label}
        </span>
        {issue.file && (
          <span style={{ fontFamily: T.mono, fontSize: 11, color: T.ink3 }}>
            {issue.file}{issue.line ? `:${issue.line}` : ''}
          </span>
        )}
      </div>
      <div style={{ marginTop: 3, fontSize: 12.5, fontWeight: 600, color: T.ink }}>{issue.title}</div>
      <div style={{ marginTop: 4, fontSize: 12, color: T.ink2, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{shown}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
        <CopyButton
          text={formatSuggestionForCopy(issue)}
          label="Copiar"
          announceLabel={`Sugestão copiada: ${issue.title}`}
          onCopied={onCopied}
        />
        {isLong && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 11.5, color: T.accent, fontWeight: 500 }}
          >
            {expanded ? 'ver menos' : 'ver mais'}
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * Renders the PR review findings that carry a suggestion, each with a copy
 * button (paste-ready markdown), plus a "copy all". Returns null when there is
 * nothing with a suggestion, so the CoPensador can render it conditionally.
 */
export function PrSuggestionsCard({ issues }: { issues: CodeIssue[] }) {
  const [announce, setAnnounce] = useState('')

  const withSuggestion = issues
    .filter((i) => i.suggestion && i.suggestion.trim())
    .sort((a, b) => severityMeta(a.severity).order - severityMeta(b.severity).order)

  if (withSuggestion.length === 0) return null

  const cardStyle: CSSProperties = {
    border: `1px solid ${T.borderStrong}`,
    background: T.surface,
    borderRadius: 8,
    padding: '10px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  }

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <MFIcon name="lightbulb" size={12} color={T.ai} />
        <span style={{ fontSize: 11.5, fontWeight: 600, color: T.ink }}>
          Sugestões da revisão ({withSuggestion.length})
        </span>
        <span style={{ marginLeft: 'auto' }}>
          <CopyButton
            text={formatAllSuggestionsForCopy(withSuggestion)}
            label="Copiar tudo"
            announceLabel={`${withSuggestion.length} sugestões copiadas`}
            onCopied={setAnnounce}
          />
        </span>
      </div>

      <div aria-live="polite" style={visuallyHidden}>{announce}</div>

      {withSuggestion.map((issue, i) => (
        <SuggestionItem key={i} issue={issue} onCopied={setAnnounce} />
      ))}
    </div>
  )
}
