'use client'

import { CSSProperties } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { T } from '@/lib/tokens'

interface DocMarkdownViewerProps {
  content: string
}

/**
 * Renders Markdown content using `react-markdown` + `remark-gfm` (GitHub-flavoured).
 * Visual styling lives in the parent scope via CSS class `.doc-markdown` so we
 * don't fight react-markdown's element nesting with inline styles.
 */
export function DocMarkdownViewer({ content }: DocMarkdownViewerProps) {
  if (!content || !content.trim()) {
    return (
      <div
        style={{
          padding: 24,
          color: T.faint,
          fontSize: 13,
          textAlign: 'center',
        }}
      >
        Esta seção não foi gerada nesta execução.
      </div>
    )
  }

  const containerStyle: CSSProperties = {
    padding: '20px 24px 32px',
    color: T.ink,
    fontSize: 13.5,
    lineHeight: 1.6,
  }

  return (
    <div className="doc-markdown" style={containerStyle}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  )
}
