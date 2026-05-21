'use client'

import { CSSProperties } from 'react'
import { T } from '@/lib/tokens'
import { CopyFixPromptButton } from '@/components/analysis/CopyFixPromptButton'
import { IssueList } from '@/components/analysis/IssueList'
import { usePublishScope } from '@/components/shell/CoPensadorScopeProvider'
import { CodeAnalysis } from '@/lib/types/analysis'
import { RepositoryResponse } from '@/lib/types/repository'

interface IssuesClientProps {
  analysis: CodeAnalysis | null
  repo: RepositoryResponse
}

export function IssuesClient({ analysis, repo }: IssuesClientProps) {
  usePublishScope(
    { kind: 'repo-issues', repoId: repo.id, analysisId: analysis?.id },
    [repo.id, analysis?.id]
  )
  const pageStyle: CSSProperties = {
    padding: '24px 28px 32px',
  }

  const headerStyle: CSSProperties = {
    marginBottom: 22,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  }

  const titleStyle: CSSProperties = {
    fontSize: 20,
    fontWeight: 600,
    color: T.ink,
    margin: 0,
    letterSpacing: '-0.01em',
  }

  const subtitleStyle: CSSProperties = {
    fontSize: 12.5,
    color: T.ink3,
  }

  const metaRowStyle: CSSProperties = {
    display: 'flex',
    gap: 14,
    fontSize: 11.5,
    color: T.faint,
    flexWrap: 'wrap',
    marginTop: 2,
  }

  const emptyStyle: CSSProperties = {
    padding: 40,
    textAlign: 'center',
    color: T.faint,
    fontSize: 13,
    border: `1px dashed ${T.border}`,
    borderRadius: T.radius.card,
    background: T.surfaceAlt,
  }

  if (!analysis) {
    return (
      <div style={pageStyle}>
        <div style={headerStyle}>
          <h1 style={titleStyle}>Alertas de {repo.name}</h1>
        </div>
        <div style={emptyStyle}>
          Nenhuma análise de código completada para este repositório ainda. Inicie uma
          análise pela página de visão geral para gerar alertas.
        </div>
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <h1 style={titleStyle}>Alertas de {repo.name}</h1>
            <span style={subtitleStyle}>
              {analysis.issue_count} alertas na análise mais recente
              {analysis.created_at && (
                <>
                  {' · '}
                  {new Date(analysis.created_at).toLocaleString('pt-BR', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </>
              )}
            </span>
          </div>
          {analysis.issues.length > 0 && (
            <CopyFixPromptButton
              repo={repo}
              issues={analysis.issues}
              analysisCreatedAt={analysis.created_at}
            />
          )}
        </div>
        <div style={metaRowStyle}>
          {analysis.ai_model && <span>Modelo: {analysis.ai_model}</span>}
          {analysis.tokens_used > 0 && <span>{analysis.tokens_used} tokens</span>}
          {analysis.processing_ms !== undefined && (
            <span>{Math.round(analysis.processing_ms / 1000)}s de processamento</span>
          )}
        </div>
      </div>

      {analysis.summary_text && (
        <p
          style={{
            background: T.surfaceAlt,
            border: `1px solid ${T.border}`,
            borderRadius: T.radius.card,
            padding: '14px 16px',
            fontSize: 13,
            color: T.ink2,
            lineHeight: 1.65,
            marginBottom: 22,
            whiteSpace: 'pre-wrap',
          }}
        >
          {analysis.summary_text}
        </p>
      )}

      <IssueList issues={analysis.issues} repo={repo} analysisCreatedAt={analysis.created_at} />
    </div>
  )
}
