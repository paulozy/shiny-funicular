'use client'

import { CSSProperties } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { T } from '@/lib/tokens'
import { parsePrBody } from '@/lib/pr-body'

interface PullRequestBodyProps {
  body?: string | null
  /** Caps the prose before a "read more" — used in the review drawer. */
  clampTo?: number
}

/**
 * A pull request description, rendered instead of dumped.
 *
 * The prose is Markdown; the `<details>` sections bots attach (release notes,
 * commit lists) collapse into native disclosures so a dependency bump does not
 * push the diff a screen and a half down the page.
 */
export function PullRequestBody({ body, clampTo }: PullRequestBodyProps) {
  const segments = parsePrBody(body)

  if (segments.length === 0) {
    return <div style={{ fontSize: 13, color: T.faint }}>Sem descrição.</div>
  }

  const summaryStyle: CSSProperties = {
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    color: T.accent700,
    padding: '6px 0',
  }

  const detailsStyle: CSSProperties = {
    borderTop: `1px solid ${T.neutral200}`,
    paddingTop: 4,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {segments.map((segment, index) => {
        if (segment.type === 'details') {
          return (
            <details key={`details-${index}`} style={detailsStyle}>
              <summary style={summaryStyle}>{segment.summary}</summary>
              <div className="doc-markdown" style={{ fontSize: 13, lineHeight: 1.6, paddingTop: 6 }}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{segment.content}</ReactMarkdown>
              </div>
            </details>
          )
        }

        const content =
          clampTo && segment.content.length > clampTo
            ? `${segment.content.slice(0, clampTo).trimEnd()}…`
            : segment.content

        return (
          <div
            key={`markdown-${index}`}
            className="doc-markdown"
            style={{ fontSize: 13.5, lineHeight: 1.65, color: T.ink }}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        )
      })}
    </div>
  )
}
