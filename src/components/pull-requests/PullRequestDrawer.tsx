'use client'

import { CSSProperties, useEffect, useState } from 'react'
import Link from 'next/link'
import { T } from '@/lib/tokens'
import { apiFetch } from '@/lib/api/client'
import { PullRequestDetailResponse } from '@/lib/types/pull_request'
import { timeAgo } from '@/lib/relative-time'
import { Button } from '@/components/ui/Button'
import { PullRequestBody } from '@/components/pull-requests/PullRequestBody'
import { useToast } from '@/components/ui/Toast'
import { RepoProvider, supportsRequestChanges } from '@/lib/types/repository'

type ReviewAction = 'approve' | 'request-changes'

export interface PullRequestDrawerTarget {
  repoId: string
  number: number
  /** Shown while the detail request is in flight, so the sheet is never blank. */
  title?: string
  repoName?: string
  /**
   * The repository's host. Lives on the target rather than on the drawer
   * because the home queue mixes repositories from different providers, and
   * "request changes" only exists on some of them.
   */
  provider?: RepoProvider
}

interface PullRequestDrawerProps {
  target: PullRequestDrawerTarget | null
  onClose: () => void
  /**
   * Whether the viewer's role allows submitting a review verdict. Defaults to
   * false so a caller that has not thought about permissions hides the
   * actions — showing a control the API would reject is the failure mode worth
   * defending against.
   */
  canReview?: boolean
}

/**
 * The review sheet: what a pull request is about, without leaving the list.
 *
 * Deciding whether a change is worth opening takes a title, a size and a
 * description — three things that fit in a side panel. The full page, with the
 * diff, is one click further in for the ones that are.
 */
export function PullRequestDrawer({ target, onClose, canReview = false }: PullRequestDrawerProps) {
  const [detail, setDetail] = useState<PullRequestDetailResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [reviewing, setReviewing] = useState<ReviewAction | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (!target) {
      setDetail(null)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setDetail(null)
    setError(null)

    apiFetch<PullRequestDetailResponse>(
      `/api/repositories/${target.repoId}/pull-requests/${target.number}`
    )
      .then((response) => {
        if (!cancelled) setDetail(response)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Falha ao carregar o PR.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [target])

  useEffect(() => {
    if (!target) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [target, onClose])

  if (!target) return null

  const pr = detail?.pull_request
  async function submitReview(action: ReviewAction) {
    if (!target) return
    setReviewing(action)
    try {
      const response = await fetch(
        `/api/repositories/${target.repoId}/pull-requests/${target.number}/${action}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ body: '' }),
        }
      )
      if (!response.ok) {
        toast(reviewErrorMessage(response.status))
        return
      }
      toast(
        action === 'approve'
          ? `PR #${target.number} aprovado`
          : `Mudanças solicitadas no #${target.number}`
      )
      onClose()
    } catch {
      toast('Não foi possível falar com o servidor. Tente de novo.')
    } finally {
      setReviewing(null)
    }
  }

  const detailHref = `/code/repositories/${target.repoId}/pull-requests/${target.number}`

  const backdropStyle: CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 60,
    background: T.overlay,
    display: 'flex',
    justifyContent: 'flex-end',
  }

  const sheetStyle: CSSProperties = {
    width: 'min(480px, 94vw)',
    background: T.surface,
    height: '100%',
    overflow: 'auto',
    padding: 24,
    boxShadow: T.shadow,
  }

  const factStyle: CSSProperties = { display: 'flex', gap: 12 }
  const factLabelStyle: CSSProperties = { color: T.faint, width: 110, flexShrink: 0 }

  return (
    <div
      style={backdropStyle}
      onClick={onClose}
      role="presentation"
    >
      <aside
        style={sheetStyle}
        role="dialog"
        aria-modal="true"
        aria-label={`Resumo do pull request #${target.number}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <span style={{ fontFamily: T.mono, fontSize: 12.5, color: T.faint }}>#{target.number}</span>
          <span style={{ flex: 1 }} />
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            style={{
              font: 'inherit',
              background: 'none',
              border: 0,
              cursor: 'pointer',
              color: T.faint,
              fontSize: 16,
            }}
          >
            ✕
          </button>
        </div>

        <h2 style={{ fontSize: 20, margin: '0 0 10px', lineHeight: 1.3 }}>
          {pr?.title ?? target.title ?? 'Carregando…'}
        </h2>

        <div
          style={{
            fontSize: 13,
            color: T.faint,
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            marginBottom: 20,
          }}
        >
          {target.repoName && <span style={{ fontFamily: T.mono }}>{target.repoName}</span>}
          {pr && (
            <>
              {target.repoName && <span>·</span>}
              <span>{pr.author_login}</span>
              <span>·</span>
              <span>{timeAgo(pr.updated_at)}</span>
            </>
          )}
        </div>

        {error && (
          <div
            role="alert"
            style={{
              background: T.dangerBg,
              color: T.danger,
              borderRadius: T.radius.button,
              padding: '10px 12px',
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        {loading && <div style={{ fontSize: 13.5, color: T.faint }}>Carregando o resumo…</div>}

        {pr && (
          <>
            <div
              style={{
                background: T.bg,
                borderRadius: T.radius.card,
                padding: 16,
                fontSize: 13.5,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                marginBottom: 20,
              }}
            >
              <div style={factStyle}>
                <span style={factLabelStyle}>Estado</span>
                <span>{pr.draft ? 'draft' : pr.state}</span>
              </div>
              {pr.changed_files !== null && (
                <div style={factStyle}>
                  <span style={factLabelStyle}>Diff</span>
                  <span>
                    <span style={{ color: T.ok, fontWeight: 600 }}>+{pr.additions_count ?? 0}</span>{' '}
                    <span style={{ color: T.danger, fontWeight: 600 }}>−{pr.deletions_count ?? 0}</span> em{' '}
                    {pr.changed_files} arquivo{pr.changed_files === 1 ? '' : 's'}
                  </span>
                </div>
              )}
              {pr.commits_count !== null && (
                <div style={factStyle}>
                  <span style={factLabelStyle}>Commits</span>
                  <span>{pr.commits_count}</span>
                </div>
              )}
              <div style={factStyle}>
                <span style={factLabelStyle}>Branches</span>
                <span style={{ fontFamily: T.mono, fontSize: 12.5 }}>
                  {pr.head_branch} → {pr.base_branch}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <PullRequestBody body={pr.body} clampTo={900} />
            </div>
          </>
        )}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link href={detailHref} style={{ textDecoration: 'none' }} onClick={onClose}>
            <Button variant="primary" size="md">
              Ver alterações
            </Button>
          </Link>
          {pr && (
            <a href={pr.html_url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
              <Button variant="default" size="md">
                Abrir no provedor
              </Button>
            </a>
          )}
          {canReview && pr && (
            <>
              <Button
                variant="primary"
                size="md"
                disabled={reviewing !== null}
                onClick={() => submitReview('approve')}
              >
                {reviewing === 'approve' ? 'Aprovando…' : 'Aprovar'}
              </Button>
              {/* GitLab has no portable "request changes"; the helper is the
                  single place that knowledge lives on the client. */}
              {supportsRequestChanges({ provider: target?.provider }) && (
                <Button
                  variant="default"
                  size="md"
                  disabled={reviewing !== null}
                  onClick={() => submitReview('request-changes')}
                >
                  {reviewing === 'request-changes' ? 'Enviando…' : 'Solicitar mudanças'}
                </Button>
              )}
            </>
          )}
          <Button variant="ghost" size="md" onClick={onClose}>
            Ver depois
          </Button>
        </div>
      </aside>
    </div>
  )
}

/**
 * 501 is not a failure: it means this repository's host has no equivalent
 * action. It should be unreachable — the button is hidden for those providers —
 * but saying so plainly beats a generic error if the two ever drift apart.
 */
function reviewErrorMessage(status: number): string {
  if (status === 403) {
    return 'Você não tem permissão para revisar neste repositório.'
  }
  if (status === 501) {
    return 'O provedor deste repositório não suporta essa ação de revisão.'
  }
  if (status === 503) {
    return 'O provedor não respondeu. Verifique o token da organização.'
  }
  return 'Não foi possível enviar a revisão.'
}
