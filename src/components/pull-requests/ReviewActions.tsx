'use client'

import { CSSProperties, useState } from 'react'
import { T } from '@/lib/tokens'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { RepoProvider, supportsRequestChanges } from '@/lib/types/repository'

export type ReviewAction = 'approve' | 'request-changes'

interface ReviewActionsProps {
  repoId: string
  number: number
  /** The repository's host — "request changes" does not exist on all of them. */
  provider?: RepoProvider
  /**
   * Whether the viewer's role allows submitting a verdict. Defaults to false so
   * a caller that has not thought about permissions renders nothing, rather
   * than a control the API would reject.
   */
  canReview?: boolean
  /**
   * Why the backend says this change request cannot be reviewed, or null when
   * nothing is known to stop it. See `review_blocked_reason` on the DTO: it is
   * advisory, so an unrecognized value still disables the actions — the backend
   * knows something the client does not.
   */
  blockedReason?: string | null
  /** Called after a verdict lands, so a caller can close or refresh itself. */
  onReviewed?: () => void
  /**
   * How much of the review vocabulary to offer.
   *
   * `approve-only` is for the list's side drawer, which is a triage surface:
   * skim, approve the easy ones, open the diff for the rest. Requesting changes
   * belongs on the page, because it requires writing *what* needs to change and
   * that is not a thing anyone can do well without the diff on screen.
   */
  mode?: 'full' | 'approve-only'
}

/**
 * The two review verdicts, wherever a pull request is shown.
 *
 * This lives in one component because it was previously reachable only from the
 * side drawer, and the page showing the actual diff — the one place a reviewer
 * has enough context to decide — had no way to act. Duplicating the fetch and
 * its error handling into a second caller would have meant duplicating the
 * error messages too, and those are the part most likely to drift.
 */
export function ReviewActions({
  repoId,
  number,
  provider,
  canReview = false,
  blockedReason = null,
  onReviewed,
  mode = 'full',
}: ReviewActionsProps) {
  const [submitting, setSubmitting] = useState<ReviewAction | null>(null)
  const [message, setMessage] = useState('')
  const [composing, setComposing] = useState(false)
  const [needsMessage, setNeedsMessage] = useState(false)
  const { toast } = useToast()

  if (!canReview) return null

  const blockedMessage = blockedReason ? reviewBlockedMessage(blockedReason) : null
  const disabled = submitting !== null || blockedMessage !== null
  // Two independent reasons to hide it: this host has no equivalent action, or
  // this surface is not the place to write one.
  const canRequestChanges = mode === 'full' && supportsRequestChanges({ provider })
  const canCompose = mode === 'full'

  async function submitReview(action: ReviewAction) {
    setSubmitting(action)
    try {
      const response = await fetch(`/api/repositories/${repoId}/pull-requests/${number}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: message.trim() }),
      })
      if (!response.ok) {
        toast(await reviewErrorMessage(response))
        return
      }
      toast(
        action === 'approve'
          ? `PR #${number} aprovado`
          : `Mudanças solicitadas no #${number}`
      )
      setMessage('')
      setComposing(false)
      onReviewed?.()
    } catch {
      toast('Não foi possível falar com o servidor. Tente de novo.')
    } finally {
      setSubmitting(null)
    }
  }

  /**
   * Requesting changes needs a message, and a disabled button cannot say so.
   * So the first click opens the composer instead of refusing: the requirement
   * becomes visible at the moment it applies. Approving takes no message —
   * "looks good" is a complete thought.
   */
  function requestChanges() {
    if (!message.trim()) {
      setComposing(true)
      setNeedsMessage(true)
      return
    }
    setNeedsMessage(false)
    submitReview('request-changes')
  }

  const hintStyle: CSSProperties = { fontSize: 12.5, color: T.faint, flexBasis: '100%' }
  const composerStyle: CSSProperties = { flexBasis: '100%', marginTop: 4 }
  const textareaStyle: CSSProperties = {
    width: '100%',
    minHeight: 84,
    resize: 'vertical',
    font: 'inherit',
    fontSize: 13.5,
    lineHeight: 1.5,
    color: T.ink,
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.button,
    padding: '8px 10px',
  }

  return (
    <>
      <Button
        variant="primary"
        size="md"
        disabled={disabled}
        title={blockedMessage ?? undefined}
        onClick={() => submitReview('approve')}
      >
        {submitting === 'approve' ? 'Aprovando…' : 'Aprovar'}
      </Button>
      {/* GitLab has no portable "request changes"; the helper is the single
          place that knowledge lives on the client. */}
      {canRequestChanges && (
        <Button
          variant="default"
          size="md"
          disabled={disabled}
          title={blockedMessage ?? undefined}
          onClick={() => requestChanges()}
        >
          {submitting === 'request-changes' ? 'Enviando…' : 'Solicitar mudanças'}
        </Button>
      )}
      {canCompose && !blockedMessage && !composing && (
        <Button variant="ghost" size="md" onClick={() => setComposing(true)}>
          Comentar
        </Button>
      )}

      {blockedMessage && <span style={hintStyle}>{blockedMessage}</span>}

      {/* The message is why "request changes" was unusable: the verdict went out
          with an empty body, so the author was told to change something with no
          indication of what. Requesting changes now requires it; approving does
          not, because "looks good" is a complete thought. */}
      {canCompose && !blockedMessage && composing && (
        <div style={composerStyle}>
          <label
            htmlFor={`review-message-${number}`}
            style={{ display: 'block', fontSize: 12.5, color: T.faint, marginBottom: 6 }}
          >
            {canRequestChanges
              ? 'O que precisa mudar? Cite os arquivos que quiser apontar.'
              : 'Comentário (opcional)'}
          </label>
          {needsMessage && !message.trim() && (
            <div role="alert" style={{ fontSize: 12.5, color: T.danger, marginBottom: 6 }}>
              Escreva o que precisa mudar — o autor recebe só esta mensagem.
            </div>
          )}
          <textarea
            id={`review-message-${number}`}
            style={textareaStyle}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            disabled={submitting !== null}
            placeholder={
              canRequestChanges
                ? 'ex.: internal/api/handlers/pull_requests.go — falta tratar o caso de token ausente'
                : 'Deixe uma nota junto da aprovação'
            }
          />
        </div>
      )}
    </>
  )
}

/**
 * Why the actions are disabled, in the reader's terms.
 *
 * An unrecognized reason still disables the buttons and says so vaguely. The
 * backend sent a reason for a purpose; treating an unknown value as
 * "no reason" would re-enable a control that is known not to work.
 */
export function reviewBlockedMessage(reason: string): string {
  switch (reason) {
    case 'self_authored':
      return 'Você abriu este PR — a aprovação precisa vir de outra pessoa.'
    default:
      return 'Este PR não pode ser revisado por você.'
  }
}

/**
 * Turns a failed review response into something worth reading.
 *
 * It reads the body, not just the status, because 409 covers every refusal the
 * host spelled out and the useful part is *which* one. That distinction is the
 * whole point of the backend change behind this: a self-review refusal used to
 * arrive as 503 "the provider did not respond", which blamed the organization's
 * token — a token that is working fine, and whose only problem is whose it is.
 */
export async function reviewErrorMessage(response: Response): Promise<string> {
  const payload = await response
    .json()
    .catch(() => null as { error?: string; message?: string } | null)

  if (response.status === 409) {
    if (payload?.error === 'self_review') {
      return (
        payload.message ??
        'A identidade do token desta organização abriu este PR, então o provedor recusa a aprovação.'
      )
    }
    // Every other refusal: the host's own words say more than we could.
    return payload?.message ?? 'O provedor recusou essa ação.'
  }
  if (response.status === 403) {
    return 'Você não tem permissão para revisar neste repositório.'
  }
  if (response.status === 501) {
    return 'O provedor deste repositório não suporta essa ação de revisão.'
  }
  if (response.status === 503) {
    return 'O provedor não respondeu. Verifique o token da organização.'
  }
  return 'Não foi possível enviar a revisão.'
}
