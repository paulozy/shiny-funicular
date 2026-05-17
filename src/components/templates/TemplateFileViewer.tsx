'use client'

import { CSSProperties, useState } from 'react'
import { T } from '@/lib/tokens'
import { GeneratedFile } from '@/lib/types/template'
import { MFIcon } from '@/components/icons/MFIcon'
import { HighlightedCodeHtml } from '@/components/templates/HighlightedCode'

interface TemplateFileViewerProps {
  file: GeneratedFile | null
  /** Pre-rendered Shiki HTML keyed by `file.path`. Computed server-side. */
  htmlByPath: Record<string, string>
}

export function TemplateFileViewer({ file, htmlByPath }: TemplateFileViewerProps) {
  const [copied, setCopied] = useState(false)

  if (!file) {
    return (
      <div
        style={{
          flex: 1,
          padding: 32,
          color: T.faint,
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        Selecione um arquivo na árvore à esquerda.
      </div>
    )
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(file.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard may be blocked in tests / restricted contexts
    }
  }

  const containerStyle: CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    background: T.surface,
  }

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 12px',
    borderBottom: `1px solid ${T.border}`,
    background: T.surfaceAlt,
  }

  const pathStyle: CSSProperties = {
    fontFamily: T.mono,
    fontSize: 12.5,
    color: T.ink,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }

  const copyButtonStyle: CSSProperties = {
    appearance: 'none',
    border: `1px solid ${T.border}`,
    borderRadius: 5,
    background: T.surface,
    color: T.ink3,
    padding: '4px 8px',
    fontSize: 11,
    fontWeight: 500,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
  }

  const bodyStyle: CSSProperties = {
    flex: 1,
    overflow: 'auto',
    padding: 0,
  }

  const html = htmlByPath[file.path] ?? ''

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <MFIcon name="doc" size={12} color={T.ink3} />
        <span style={pathStyle}>{file.path}</span>
        <span
          style={{
            fontSize: 11,
            color: T.faint,
            padding: '1px 6px',
            border: `1px solid ${T.border}`,
            borderRadius: 4,
            background: T.surface,
            fontFamily: T.mono,
          }}
        >
          {file.language || 'plaintext'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          style={{ ...copyButtonStyle, marginLeft: 'auto' }}
          aria-label="Copiar conteúdo"
        >
          <MFIcon name={copied ? 'check' : 'copy'} size={11} color="currentColor" />
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
      <div style={bodyStyle}>
        {html ? (
          <HighlightedCodeHtml html={html} />
        ) : (
          <pre style={{ margin: 0, padding: '12px 16px', fontFamily: T.mono, fontSize: 12.5 }}>
            {file.content}
          </pre>
        )}
      </div>
    </div>
  )
}
