'use client'

import { CSSProperties } from 'react'
import { T } from '@/lib/tokens'
import { PullRequestFileResponse } from '@/lib/types/pull_request'
import { DiffLineType, parseUnifiedDiff } from '@/lib/diff'

interface DiffViewProps {
  file: PullRequestFileResponse
}

const ADD_BG = 'rgba(46, 160, 67, 0.12)'
const DEL_BG = 'rgba(248, 81, 73, 0.12)'

export function DiffView({ file }: DiffViewProps) {
  const hunks = parseUnifiedDiff(file.patch)

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
    borderBottom: `1px solid ${T.border}`,
    fontSize: 12,
    background: T.surfaceAlt,
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

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <span style={{ fontFamily: T.mono, fontWeight: 600, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {file.filename}
        </span>
        <span style={{ color: T.ok, fontWeight: 600 }}>+{file.additions}</span>
        <span style={{ color: T.danger, fontWeight: 600 }}>-{file.deletions}</span>
      </div>

      {hunks.length === 0 ? (
        <div style={{ padding: '10px 12px', fontSize: 12, color: T.faint }}>Diff não disponível para este arquivo.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          {hunks.map((hunk, hi) => (
            <div key={hi}>
              <div style={hunkHeaderStyle}>{hunk.header}</div>
              {hunk.lines.map((line, li) => (
                <div key={li} style={rowStyle(line.type)}>
                  <span style={gutterStyle}>{line.oldLine ?? ''}</span>
                  <span style={gutterStyle}>{line.newLine ?? ''}</span>
                  <span style={signStyle}>{line.type === 'add' ? '+' : line.type === 'del' ? '-' : ' '}</span>
                  <span style={contentStyle}>{line.content || ' '}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
