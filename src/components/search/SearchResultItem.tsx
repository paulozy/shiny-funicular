'use client'

import Link from 'next/link'
import { CSSProperties, useState } from 'react'
import { T } from '@/lib/tokens'
import { MFIcon } from '@/components/icons/MFIcon'
import { SemanticSearchResult } from '@/lib/types/search'
import { buildFileStubHref, formatSearchScore } from '@/lib/search'
import { copyText as copyToClipboard } from '@/lib/clipboard'

interface SearchResultItemProps {
  repoId: string
  result: SemanticSearchResult
}

function linesLabel(result: SemanticSearchResult): string {
  if (result.start_line && result.end_line && result.start_line !== result.end_line) {
    return `${result.start_line}-${result.end_line}`
  }
  if (result.start_line) return String(result.start_line)
  return '-'
}

export function SearchResultItem({ repoId, result }: SearchResultItemProps) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const fileHref = buildFileStubHref(repoId, result)
  const pathWithLines = `${result.file_path}:${linesLabel(result)}`

  const copyText = async (label: string, text: string) => {
    if (await copyToClipboard(text)) {
      setCopied(label)
      window.setTimeout(() => setCopied(null), 1200)
    }
  }

  const cardStyle: CSSProperties = {
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.card,
    padding: 14,
  }

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 9,
    minWidth: 0,
  }

  const pathStyle: CSSProperties = {
    fontFamily: T.mono,
    fontSize: 13,
    fontWeight: 600,
    color: T.ink,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }

  const metaStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 10,
  }

  const tagStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.tag,
    background: T.surfaceAlt,
    color: T.ink2,
    padding: '1px 7px',
    fontSize: 11,
    fontWeight: 500,
  }

  const snippetStyle: CSSProperties = {
    margin: 0,
    maxHeight: expanded ? 520 : 190,
    overflow: 'auto',
    whiteSpace: 'pre',
    fontFamily: T.mono,
    fontSize: 12,
    lineHeight: 1.55,
    color: T.ink2,
    background: T.surfaceAlt,
    border: `1px solid ${T.border}`,
    borderRadius: 6,
    padding: 12,
  }

  const actionBarStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 10,
  }

  const actionStyle: CSSProperties = {
    appearance: 'none',
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.button,
    background: T.surface,
    color: T.ink2,
    font: `500 12px ${T.font}`,
    padding: '5px 8px',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
  }

  return (
    <article style={cardStyle}>
      <div style={headerStyle}>
        <MFIcon name="doc" size={14} color={T.accent} />
        <div style={pathStyle} title={result.file_path}>
          {result.file_path}
        </div>
        <div style={{ marginLeft: 'auto', ...tagStyle, background: T.aiBg, color: T.ai }}>
          {formatSearchScore(result.score)}
        </div>
      </div>

      <div style={metaStyle}>
        <span style={tagStyle}>linhas {linesLabel(result)}</span>
        <span style={tagStyle}>{result.branch || 'branch'}</span>
        {result.language && <span style={tagStyle}>{result.language}</span>}
        <span style={tagStyle}>{result.provider}</span>
        <span style={tagStyle}>{result.model}</span>
      </div>

      <pre style={snippetStyle}>
        <code>{result.content}</code>
      </pre>

      <div style={actionBarStyle}>
        <Link href={fileHref} style={actionStyle}>
          <MFIcon name="folder" size={12} color={T.ink3} />
          Abrir arquivo
        </Link>
        <button type="button" style={actionStyle} onClick={() => copyText('path', pathWithLines)}>
          Copiar path/linhas
        </button>
        <button type="button" style={actionStyle} onClick={() => copyText('snippet', result.content)}>
          Copiar trecho
        </button>
        <button type="button" style={actionStyle} onClick={() => setExpanded((value) => !value)}>
          {expanded ? 'Recolher' : 'Expandir'}
        </button>
        {copied && <span style={{ fontSize: 12, color: T.ok }}>Copiado</span>}
      </div>
    </article>
  )
}
