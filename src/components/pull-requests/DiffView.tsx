'use client'

import { CSSProperties, useEffect, useState } from 'react'
import { T } from '@/lib/tokens'
import { PullRequestFileResponse } from '@/lib/types/pull_request'
import { DiffLineType, parseUnifiedDiff } from '@/lib/diff'

interface DiffViewProps {
  file: PullRequestFileResponse
  /** Whether the patch starts expanded. Large files come in collapsed. */
  defaultOpen?: boolean
}

const ADD_BG = 'rgba(46, 160, 67, 0.12)'
const DEL_BG = 'rgba(248, 81, 73, 0.12)'

/**
 * How many diff lines render before the rest is held back.
 *
 * A generated lockfile or a vendored bundle can be tens of thousands of lines;
 * painting all of them freezes the tab and buries every other file in the pull
 * request. The remainder stays one click away.
 */
const LINE_BUDGET = 300

export function DiffView({ file, defaultOpen = true }: DiffViewProps) {
  const [open, setOpen] = useState(defaultOpen)
  const [showAll, setShowAll] = useState(false)

  // The parent's "expand/collapse all" drives `defaultOpen`; follow it.
  useEffect(() => setOpen(defaultOpen), [defaultOpen])

  const hunks = parseUnifiedDiff(file.patch)
  const totalLines = hunks.reduce((sum, hunk) => sum + hunk.lines.length, 0)
  const truncated = !showAll && totalLines > LINE_BUDGET

  const cardStyle: CSSProperties = {
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.card,
    background: T.surface,
    overflow: 'hidden',
  }
  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 12px',
    borderBottom: open ? `1px solid ${T.border}` : 'none',
    fontSize: 12,
    background: T.neutral100,
    width: '100%',
    font: 'inherit',
    fontFamily: T.font,
    border: 0,
    cursor: 'pointer',
    textAlign: 'left',
  }
  const hunkHeaderStyle: CSSProperties = {
    fontFamily: T.mono,
    fontSize: 11,
    color: T.ink3,
    background: T.bg,
    padding: '3px 12px',
    borderTop: `1px solid ${T.border}`,
    borderBottom: `1px solid ${T.border}`,
  }
  const gutterStyle: CSSProperties = {
    display: 'inline-block',
    width: 40,
    textAlign: 'right',
    paddingRight: 8,
    color: T.faint,
    userSelect: 'none',
    flexShrink: 0,
  }
  const rowStyle = (type: DiffLineType): CSSProperties => ({
    display: 'flex',
    fontFamily: T.mono,
    fontSize: 12,
    lineHeight: 1.6,
    background: type === 'add' ? ADD_BG : type === 'del' ? DEL_BG : 'transparent',
    whiteSpace: 'pre',
  })
  const signStyle: CSSProperties = {
    display: 'inline-block',
    width: 14,
    color: T.faint,
    flexShrink: 0,
  }
  const contentStyle: CSSProperties = { color: T.ink }

  let budget = LINE_BUDGET

  return (
    <div style={cardStyle}>
      <button
        type="button"
        style={headerStyle}
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
      >
        <span style={{ color: T.faint, width: 10, flexShrink: 0 }} aria-hidden="true">
          {open ? '▾' : '▸'}
        </span>
        <span
          style={{
            fontFamily: T.mono,
            fontWeight: 600,
            color: T.ink,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {file.filename}
        </span>
        <span style={{ flex: 1 }} />
        <span style={{ color: T.ok, fontWeight: 600 }}>+{file.additions}</span>
        <span style={{ color: T.danger, fontWeight: 600 }}>-{file.deletions}</span>
      </button>

      {open &&
        (hunks.length === 0 ? (
          <div style={{ padding: '10px 12px', fontSize: 12, color: T.faint }}>
            Diff não disponível para este arquivo.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            {hunks.map((hunk, hi) => {
              if (truncated && budget <= 0) return null
              const lines = truncated ? hunk.lines.slice(0, budget) : hunk.lines
              budget -= lines.length

              return (
                <div key={hi}>
                  <div style={hunkHeaderStyle}>{hunk.header}</div>
                  {lines.map((line, li) => (
                    <div key={li} style={rowStyle(line.type)}>
                      <span style={gutterStyle}>{line.oldLine ?? ''}</span>
                      <span style={gutterStyle}>{line.newLine ?? ''}</span>
                      <span style={signStyle}>
                        {line.type === 'add' ? '+' : line.type === 'del' ? '-' : ' '}
                      </span>
                      <span style={contentStyle}>{line.content || ' '}</span>
                    </div>
                  ))}
                </div>
              )
            })}

            {truncated && (
              <button
                type="button"
                onClick={() => setShowAll(true)}
                style={{
                  width: '100%',
                  font: 'inherit',
                  fontSize: 12.5,
                  padding: '10px 12px',
                  background: T.neutral100,
                  border: 0,
                  borderTop: `1px solid ${T.border}`,
                  color: T.accent700,
                  cursor: 'pointer',
                }}
              >
                Mostrar as {totalLines - LINE_BUDGET} linhas restantes
              </button>
            )}
          </div>
        ))}
    </div>
  )
}
