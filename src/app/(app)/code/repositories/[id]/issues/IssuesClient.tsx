'use client'

import { CSSProperties, useState } from 'react'
import { IssueResponse } from '@/lib/types/issue'
import { Tag } from '@/components/ui/Tag'
import { Alert } from '@/components/ui/Alert'
import { useToast } from '@/components/ui/Toast'
import { timeAgo } from '@/lib/relative-time'
import { T } from '@/lib/tokens'

interface IssuesClientProps {
  repoId: string
  items: IssueResponse[]
  /** Whether the viewer's role allows closing an issue. */
  canClose: boolean
  loadError: string | null
}

export function IssuesClient({ repoId, items, canClose, loadError }: IssuesClientProps) {
  const { toast } = useToast()
  // Closing is optimistic in the sense that the row leaves the list on success;
  // the host is the source of truth and a reload re-reads it.
  const [closed, setClosed] = useState<Set<number>>(new Set())
  const [closing, setClosing] = useState<number | null>(null)

  const visible = items.filter((issue) => !closed.has(issue.number))

  async function closeIssue(issue: IssueResponse) {
    setClosing(issue.number)
    try {
      const response = await fetch(`/api/repositories/${repoId}/issues/${issue.number}/close`, {
        method: 'POST',
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        toast(closeErrorMessage(response.status, payload?.error))
        return
      }
      setClosed((current) => new Set(current).add(issue.number))
      toast(`Issue #${issue.number} fechada`)
    } catch {
      toast('Não foi possível falar com o servidor. Tente de novo.')
    } finally {
      setClosing(null)
    }
  }

  if (loadError) {
    return (
      <Alert variant="warn">Não foi possível carregar as issues: {loadError}</Alert>
    )
  }

  if (visible.length === 0) {
    return (
      <p style={{ fontSize: 13.5, color: T.neutral600, margin: 0 }}>
        Nenhuma issue aberta neste repositório.
      </p>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {visible.map((issue) => (
        <div key={issue.number} style={cardStyle}>
          <div style={{ minWidth: 260, flex: 1 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 9,
                flexWrap: 'wrap',
              }}
            >
              <span style={{ fontFamily: T.mono, fontSize: 12.5, color: T.neutral600 }}>
                #{issue.number}
              </span>
              <a
                href={issue.html_url}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: 15, fontWeight: 600, color: T.ink, textDecoration: 'none' }}
              >
                {issue.title}
              </a>
              {issue.labels.map((label) => (
                <Tag key={label}>{label}</Tag>
              ))}
            </div>
            <span
              style={{
                display: 'block',
                fontSize: 12.5,
                color: T.neutral600,
                marginTop: 6,
              }}
            >
              {issueMeta(issue)}
            </span>
          </div>

          {canClose && (
            <button
              type="button"
              onClick={() => closeIssue(issue)}
              disabled={closing === issue.number}
              style={closeButtonStyle(closing === issue.number)}
            >
              {closing === issue.number ? 'Fechando…' : 'Fechar issue'}
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

/** "aberta por ana.m · há 2 dias · 3 comentários", as the mockup phrases it. */
function issueMeta(issue: IssueResponse): string {
  const parts = [`aberta por ${issue.author_login || 'desconhecido'}`, timeAgo(issue.created_at)]
  parts.push(issue.comments_count === 1 ? '1 comentário' : `${issue.comments_count} comentários`)
  return parts.join(' · ')
}

/**
 * A 501 here is not a failure — it means the repository's host has no such
 * action — and a 403 is the ownership rule the frontend cannot evaluate.
 */
function closeErrorMessage(status: number, code?: string): string {
  if (status === 403) {
    return 'Você não tem permissão para fechar issues neste repositório.'
  }
  if (status === 503 || code === 'provider_unavailable') {
    return 'O provedor não respondeu. Verifique o token da organização.'
  }
  return 'Não foi possível fechar a issue.'
}

const cardStyle: CSSProperties = {
  background: T.surface,
  border: `1px solid ${T.border}`,
  borderRadius: T.radius.card,
  padding: '16px 18px',
  display: 'flex',
  gap: 12,
  alignItems: 'flex-start',
  flexWrap: 'wrap',
}

function closeButtonStyle(busy: boolean): CSSProperties {
  return {
    font: 'inherit',
    fontSize: 12.5,
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.button,
    color: T.ink,
    padding: '7px 12px',
    cursor: busy ? 'progress' : 'pointer',
    opacity: busy ? 0.6 : 1,
    whiteSpace: 'nowrap',
  }
}
