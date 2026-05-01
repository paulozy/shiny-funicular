'use client'

import Link from 'next/link'
import { CSSProperties } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { SearchInsight, SemanticSearchResult } from '@/lib/types/search'
import { buildFileStubHref } from '@/lib/search'
import { T } from '@/lib/tokens'
import { MFIcon } from '@/components/icons/MFIcon'

interface SearchSynthesisCardProps {
  repoId?: string
  insight: SearchInsight
}

const FILE_REF_RE = /(?<![\w/.-])([\w./-]+\.[\w+-]+):(\d+)(?:-(\d+))?/g

function lineOverlaps(result: SemanticSearchResult, startLine: number, endLine?: number): boolean {
  if (!result.start_line) return true
  const resultStart = result.start_line
  const resultEnd = result.end_line || result.start_line
  const refEnd = endLine || startLine
  return startLine <= resultEnd && refEnd >= resultStart
}

function findReferencedResult(results: SemanticSearchResult[] | undefined, filePath: string, startLine: number, endLine?: number) {
  return results?.find((result) => result.file_path === filePath && lineOverlaps(result, startLine, endLine))
}

function decorateReferences(markdown: string, repoId?: string, results?: SemanticSearchResult[]): string {
  return markdown.replace(FILE_REF_RE, (full, filePath: string, start: string, end?: string) => {
    const startLine = Number(start)
    const endLine = end ? Number(end) : undefined
    const result = findReferencedResult(results, filePath, startLine, endLine)

    if (!repoId || !result) return `\`${full}\``

    const href = buildFileStubHref(repoId, {
      file_path: filePath,
      branch: result.branch,
      start_line: startLine,
      end_line: endLine || startLine,
    })

    return `[${full}](${href})`
  })
}

export function SearchSynthesisCard({ repoId, insight }: SearchSynthesisCardProps) {
  const statusLabel: Record<string, string> = {
    streaming: 'Sintetizando',
    done: 'Concluída',
    cached: 'Cache',
    unavailable: 'Indisponível',
    error: 'Falhou',
    idle: 'Síntese',
  }

  const tone =
    insight.status === 'error'
      ? T.danger
      : insight.status === 'unavailable'
        ? T.warn
        : T.ai

  const text = decorateReferences(insight.text, repoId, insight.results)

  const cardStyle: CSSProperties = {
    border: `1px solid ${insight.status === 'error' ? T.dangerBorder : insight.status === 'unavailable' ? T.warnBorder : T.aiBorder}`,
    background: T.surface,
    borderRadius: 8,
    padding: '11px 12px',
  }

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    marginBottom: 8,
  }

  const titleStyle: CSSProperties = {
    fontSize: 12,
    fontWeight: 700,
    color: tone,
  }

  const badgeStyle: CSSProperties = {
    marginLeft: 'auto',
    border: `1px solid ${insight.status === 'error' ? T.dangerBorder : insight.status === 'unavailable' ? T.warnBorder : T.aiBorder}`,
    borderRadius: T.radius.tag,
    color: tone,
    background: insight.status === 'error' ? T.dangerBg : insight.status === 'unavailable' ? T.warnBg : T.aiBg,
    padding: '1px 7px',
    fontSize: 10.5,
    fontWeight: 600,
  }

  const queryStyle: CSSProperties = {
    color: T.faint,
    fontSize: 11.5,
    marginBottom: text ? 10 : 0,
    overflowWrap: 'anywhere',
  }

  const markdownStyle: CSSProperties = {
    color: T.ink,
    fontSize: 12.5,
    lineHeight: 1.55,
    overflowWrap: 'anywhere',
  }

  const footerStyle: CSSProperties = {
    marginTop: 10,
    paddingTop: 8,
    borderTop: `1px solid ${T.border}`,
    color: T.faint,
    fontSize: 11,
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  }

  const codeStyle: CSSProperties = {
    fontFamily: T.mono,
    fontSize: '0.92em',
    border: `1px solid ${T.border}`,
    borderRadius: 5,
    background: T.surfaceAlt,
    padding: '1px 4px',
  }

  const linkStyle: CSSProperties = {
    display: 'inline-flex',
    maxWidth: '100%',
    color: T.accent,
    background: T.accentBg,
    border: `1px solid ${T.border}`,
    borderRadius: 5,
    padding: '0 4px',
    textDecoration: 'none',
    fontFamily: T.mono,
    fontSize: '0.92em',
    overflowWrap: 'anywhere',
  }

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <MFIcon name="sparkles" size={12} color={tone} />
        <span style={titleStyle}>Síntese da busca</span>
        <span style={badgeStyle}>{statusLabel[insight.status] || 'Síntese'}</span>
      </div>

      <div style={queryStyle}>{insight.query}</div>

      {text ? (
        <div style={markdownStyle}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => <h2 style={{ margin: '0 0 8px', fontSize: 15, lineHeight: 1.25, color: T.ink }}>{children}</h2>,
              h2: ({ children }) => <h3 style={{ margin: '12px 0 5px', fontSize: 13.5, lineHeight: 1.3, color: T.ink }}>{children}</h3>,
              h3: ({ children }) => <h4 style={{ margin: '10px 0 4px', fontSize: 12.5, lineHeight: 1.3, color: T.ink2 }}>{children}</h4>,
              p: ({ children }) => <p style={{ margin: '0 0 8px' }}>{children}</p>,
              ul: ({ children }) => <ul style={{ margin: '4px 0 9px', paddingLeft: 17 }}>{children}</ul>,
              ol: ({ children }) => <ol style={{ margin: '4px 0 9px', paddingLeft: 17 }}>{children}</ol>,
              li: ({ children }) => <li style={{ margin: '2px 0' }}>{children}</li>,
              strong: ({ children }) => <strong style={{ color: T.ink, fontWeight: 700 }}>{children}</strong>,
              code: ({ children }) => <code style={codeStyle}>{children}</code>,
              pre: ({ children }) => (
                <pre style={{ margin: '8px 0', overflowX: 'auto', border: `1px solid ${T.border}`, borderRadius: 6, background: T.surfaceAlt, padding: 9 }}>
                  {children}
                </pre>
              ),
              a: ({ href, children }) => {
                if (href?.startsWith('/code/repositories/')) {
                  return (
                    <Link href={href} style={linkStyle}>
                      {children}
                    </Link>
                  )
                }
                return (
                  <a href={href} target="_blank" rel="noreferrer" style={{ color: T.accent, textDecoration: 'none' }}>
                    {children}
                  </a>
                )
              },
              table: ({ children }) => <table style={{ width: '100%', borderCollapse: 'collapse', margin: '8px 0', fontSize: 11.5 }}>{children}</table>,
              th: ({ children }) => <th style={{ border: `1px solid ${T.border}`, padding: 5, textAlign: 'left', background: T.surfaceAlt }}>{children}</th>,
              td: ({ children }) => <td style={{ border: `1px solid ${T.border}`, padding: 5, verticalAlign: 'top' }}>{children}</td>,
            }}
          >
            {text}
          </ReactMarkdown>
        </div>
      ) : (
        <div style={markdownStyle}>
          {insight.status === 'unavailable'
            ? `Síntese indisponível: ${insight.reason || 'sem motivo informado'}.`
            : insight.status === 'error'
              ? `Não foi possível completar a síntese: ${insight.reason || 'erro no stream'}.`
              : 'Aguardando os resultados para iniciar a síntese.'}
        </div>
      )}

      {(insight.cached || insight.tokensUsed !== undefined || insight.model) && (
        <div style={footerStyle}>
          {insight.cached && <span>cache</span>}
          {insight.model && <span>{insight.model}</span>}
          {insight.tokensUsed !== undefined && <span>{insight.tokensUsed} tokens</span>}
        </div>
      )}
    </div>
  )
}
