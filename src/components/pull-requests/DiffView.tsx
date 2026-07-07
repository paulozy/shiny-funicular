'use client'

import { CSSProperties } from 'react'
import { T } from '@/lib/tokens'
import { CodeIssue, PullRequestFileResponse } from '@/lib/types/pull_request'
import { DiffLineType, diffNewLines, parseUnifiedDiff } from '@/lib/diff'
import { FindingCard } from './FindingCard'

interface DiffViewProps {
  file: PullRequestFileResponse
  issues: CodeIssue[]
}

const ADD_BG = 'rgba(46, 160, 67, 0.12)'
const DEL_BG = 'rgba(248, 81, 73, 0.12)'

export function DiffView({ file, issues }: DiffViewProps) {
  const hunks = parseUnifiedDiff(file.patch)
  const newLines = diffNewLines(file.patch)

  // Anchor findings to their post-image line when it exists in the diff;
  // everything else (no line, or a line outside the diff) falls back to a list
  // shown above the diff so it never gets silently dropped.
  const byLine = new Map<number, CodeIssue[]>()
  const unanchored: CodeIssue[] = []
  for (const issue of issues) {
    if (issue.line && newLines.has(issue.line)) {
      const arr = byLine.get(issue.line) ?? []
      arr.push(issue)
      byLine.set(issue.line, arr)
    } else {
      unanchored.push(issue)
    }
  }

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

      {unanchored.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 12px', borderBottom: `1px solid ${T.border}` }}>
          {unanchored.map((issue, i) => (
            <FindingCard key={`u${i}`} issue={issue} showLocation />
          ))}
        </div>
      )}

      {hunks.length === 0 ? (
        <div style={{ padding: '10px 12px', fontSize: 12, color: T.faint }}>Diff não disponível para este arquivo.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          {hunks.map((hunk, hi) => (
            <div key={hi}>
              <div style={hunkHeaderStyle}>{hunk.header}</div>
              {hunk.lines.map((line, li) => {
                const anchored = line.newLine !== undefined ? byLine.get(line.newLine) : undefined
                return (
                  <div key={li}>
                    <div style={rowStyle(line.type)}>
                      <span style={gutterStyle}>{line.oldLine ?? ''}</span>
                      <span style={gutterStyle}>{line.newLine ?? ''}</span>
                      <span style={signStyle}>{line.type === 'add' ? '+' : line.type === 'del' ? '-' : ' '}</span>
                      <span style={contentStyle}>{line.content || ' '}</span>
                    </div>
                    {anchored && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 12px 8px 40px', background: T.surfaceAlt }}>
                        {anchored.map((issue, ai) => (
                          <FindingCard key={`a${ai}`} issue={issue} showLocation={false} />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
