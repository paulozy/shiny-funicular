'use client'

import { CSSProperties, useState } from 'react'
import Link from 'next/link'
import { T } from '@/lib/tokens'
import { apiFetch } from '@/lib/api/client'
import { CodeTemplate, TemplateStatus } from '@/lib/types/template'
import { MFIcon } from '@/components/icons/MFIcon'

interface TemplateCardProps {
  template: CodeTemplate
  onUpdated?: (next: CodeTemplate) => void
}

function statusTone(status: TemplateStatus): string {
  switch (status) {
    case 'completed':
      return T.ok
    case 'failed':
      return T.danger
    case 'generating':
      return T.accent
    default:
      return T.faint
  }
}

function statusLabel(status: TemplateStatus): string {
  switch (status) {
    case 'completed':
      return 'Concluído'
    case 'failed':
      return 'Falhou'
    case 'generating':
      return 'Gerando…'
    default:
      return 'Pendente'
  }
}

export function TemplateCard({ template, onUpdated }: TemplateCardProps) {
  const [pinning, setPinning] = useState(false)
  const [pinned, setPinned] = useState(template.is_pinned)

  const togglePin = async (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    if (pinning) return
    const next = !pinned
    setPinned(next) // optimistic
    setPinning(true)
    try {
      const updated = await apiFetch<CodeTemplate>(`/api/templates/${template.id}/pin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_pinned: next }),
      })
      onUpdated?.(updated)
    } catch {
      setPinned(!next) // rollback
    } finally {
      setPinning(false)
    }
  }

  const cardStyle: CSSProperties = {
    position: 'relative',
    background: T.surface,
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
    gap: 8,
  }

  const titleStyle: CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    color: T.ink,
    textDecoration: 'none',
    flex: 1,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  }

  const summaryStyle: CSSProperties = {
    fontSize: 12,
    color: T.ink3,
    lineHeight: 1.45,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  }

  const footerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 11,
    color: T.faint,
    marginTop: 'auto',
  }

  const statusPillStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '2px 8px',
    borderRadius: T.radius.tag,
    background: T.surfaceAlt,
    border: `1px solid ${T.border}`,
    color: statusTone(template.status),
    fontSize: 11,
    fontWeight: 600,
  }

  const pinButtonStyle: CSSProperties = {
    position: 'relative',
    zIndex: 2,
    appearance: 'none',
    border: `1px solid ${T.border}`,
    borderRadius: 5,
    background: pinned ? T.accentBg : T.surface,
    color: pinned ? T.accent : T.ink3,
    width: 26,
    height: 26,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: pinning ? 'not-allowed' : 'pointer',
  }

  const displayName = template.name || template.summary || template.prompt
  const stackLanguages = template.stack_snapshot?.languages?.slice(0, 3) ?? []

  return (
    <div className="repo-card" style={cardStyle}>
      <div style={headerStyle}>
        <MFIcon name="copy" size={13} color={T.ai} />
        <Link
          href={`/templates/${template.id}`}
          className="repo-card-link"
          style={titleStyle}
          title={displayName}
        >
          {displayName}
        </Link>
        <button
          type="button"
          style={pinButtonStyle}
          onClick={togglePin}
          disabled={pinning}
          aria-label={pinned ? 'Desfixar template' : 'Fixar template'}
          title={pinned ? 'Desfixar template' : 'Fixar template'}
        >
          <MFIcon name="flag" size={12} color="currentColor" />
        </button>
      </div>

      {template.summary && (
        <div style={summaryStyle}>{template.summary}</div>
      )}

      {stackLanguages.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {stackLanguages.map((lang) => (
            <span
              key={lang}
              style={{
                display: 'inline-flex',
                padding: '1px 7px',
                fontSize: 11,
                borderRadius: T.radius.tag,
                background: T.surfaceAlt,
                color: T.ink2,
                border: `1px solid ${T.border}`,
              }}
            >
              {lang}
            </span>
          ))}
        </div>
      )}

      <div style={footerStyle}>
        <span style={statusPillStyle}>{statusLabel(template.status)}</span>
        <span style={{ marginLeft: 'auto' }}>
          {template.files.length} arquivos · {template.tokens_used.toLocaleString('pt-BR')} tokens
        </span>
      </div>
    </div>
  )
}
