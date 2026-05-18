'use client'

import { CSSProperties } from 'react'
import { T } from '@/lib/tokens'
import {
  DOC_TYPE_LABELS,
  DocGenerationStatus,
  DocGenerationSummary,
  DocType,
} from '@/lib/types/docs'
import { MFIcon } from '@/components/icons/MFIcon'

interface DocGenerationCardProps {
  summary: DocGenerationSummary
  active?: boolean
  onSelect: (summary: DocGenerationSummary) => void
}

function statusTone(status: DocGenerationStatus): string {
  switch (status) {
    case 'completed':
      return T.ok
    case 'failed':
      return T.danger
    case 'in_progress':
      return T.accent
    default:
      return T.faint
  }
}

function statusLabel(status: DocGenerationStatus): string {
  switch (status) {
    case 'completed':
      return 'Concluído'
    case 'failed':
      return 'Falhou'
    case 'in_progress':
      return 'Gerando…'
    default:
      return 'Pendente'
  }
}

export function DocGenerationCard({ summary, active, onSelect }: DocGenerationCardProps) {
  const containerStyle: CSSProperties = {
    appearance: 'none',
    border: `1px solid ${active ? T.accent : T.border}`,
    borderRadius: 8,
    padding: '10px 12px',
    background: active ? T.accentBg : T.surface,
    color: T.ink,
    width: '100%',
    textAlign: 'left',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  }

  const titleStyle: CSSProperties = {
    fontSize: 12.5,
    fontWeight: 600,
    color: T.ink,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  }

  const typesLine = (summary.types as DocType[])
    .map((t) => DOC_TYPE_LABELS[t] ?? t)
    .join(' · ')

  return (
    <button type="button" style={containerStyle} onClick={() => onSelect(summary)}>
      <div style={titleStyle}>
        <MFIcon name="doc" size={12} color={statusTone(summary.status)} />
        {new Date(summary.created_at).toLocaleString('pt-BR', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
        <span style={{ marginLeft: 'auto', fontSize: 11, color: statusTone(summary.status) }}>
          {statusLabel(summary.status)}
        </span>
      </div>
      <div style={{ fontSize: 11.5, color: T.ink3 }}>{typesLine || '—'}</div>
      <div style={{ fontSize: 11, color: T.faint }}>
        {summary.tokens_used.toLocaleString('pt-BR')} tokens
        {summary.pull_request_number ? ` · PR #${summary.pull_request_number}` : ''}
      </div>
    </button>
  )
}
