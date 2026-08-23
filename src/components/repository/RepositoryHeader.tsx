'use client'

import { CSSProperties, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { RepositoryResponse } from '@/lib/types/repository'
import { apiFetch } from '@/lib/api/client'
import { timeAgo } from '@/lib/relative-time'
import { T } from '@/lib/tokens'
import { Button } from '@/components/ui/Button'
import { Tag } from '@/components/ui/Tag'

interface RepositoryHeaderProps {
  repo: RepositoryResponse
  canSync?: boolean
}

/**
 * The repository identity block, shared by every tab of the repository scope.
 *
 * v3 puts it above the tab row and keeps it there while the person moves
 * between overview, pull requests and settings — which is why it lives in the
 * layout rather than in each page.
 */
/** How long to keep polling for a queued sync to actually start. */
const QUEUED_POLL_TIMEOUT_MS = 45_000
const QUEUED_POLL_INTERVAL_MS = 2_000

type SyncFeedback = { tone: 'info' | 'warn' | 'error'; message: string }

export function RepositoryHeader({ repo, canSync = false }: RepositoryHeaderProps) {
  const router = useRouter()
  const [posting, setPosting] = useState(false)
  const [queued, setQueued] = useState(false)
  const [feedback, setFeedback] = useState<SyncFeedback | null>(null)

  const branch = repo.metadata?.default_branch || 'main'

  // The button is busy while the request is in flight, while we are waiting for a
  // queued job to be picked up, AND whenever the repository is genuinely syncing —
  // including a sync someone else started. Deriving it only from the request was
  // the bug: the POST just enqueues and returns in milliseconds, so the button
  // flashed and went straight back to clickable, letting one person queue the same
  // job a dozen times.
  const busy = posting || queued || repo.sync_status === 'syncing'

  // A sync that started or finished is the signal that the queued job was picked
  // up, so the wait ends on real state rather than on a timer.
  useEffect(() => {
    if (!queued) return
    if (repo.sync_status === 'syncing') {
      setQueued(false)
      setFeedback({ tone: 'info', message: 'Sincronizando…' })
      return
    }
    const startedAt = Date.now()
    const timer = setInterval(() => {
      if (Date.now() - startedAt > QUEUED_POLL_TIMEOUT_MS) {
        setQueued(false)
        // Honest about not knowing: the job was accepted, and we stopped watching.
        setFeedback({
          tone: 'warn',
          message: 'Ainda na fila. Atualize a página para ver o resultado.',
        })
        return
      }
      router.refresh()
    }, QUEUED_POLL_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [queued, repo.sync_status, repo.last_synced_at, router])

  async function handleSync() {
    if (busy) return
    setPosting(true)
    setFeedback(null)
    try {
      const job = await apiFetch<{ status: string; retry_after_seconds?: number }>(
        `/api/repositories/${repo.id}/sync`,
        { method: 'POST' }
      )
      // Every outcome says something different, and they used to be one silent
      // "skipped" — a person 5 seconds early got the same nothing as a person
      // whose worker did not exist.
      switch (job.status) {
        case 'queued':
          setQueued(true)
          setFeedback({ tone: 'info', message: 'Sincronização na fila…' })
          break
        case 'throttled': {
          const seconds = job.retry_after_seconds
          setFeedback({
            tone: 'warn',
            message: seconds
              ? `Sincronizado agora há pouco. Tente de novo em ${seconds}s.`
              : 'Sincronizado agora há pouco. Tente de novo em instantes.',
          })
          break
        }
        case 'already_syncing':
          setFeedback({ tone: 'info', message: 'Já existe uma sincronização em andamento.' })
          router.refresh()
          break
        default:
          setFeedback({ tone: 'info', message: `Sincronização: ${job.status}` })
      }
    } catch (error) {
      // A dead queue is a 503 and has to be said out loud: the job was never
      // scheduled, so waiting is pointless. Swallowing this is what made "cliquei
      // e não aconteceu nada" impossible to diagnose.
      // apiFetch throws AuthError, which carries `status`; the legacy backend
      // client path carries `statusCode`. Reading only one of them is how a 503
      // silently becomes a generic failure.
      const failure = error as { status?: number; statusCode?: number }
      const status = failure.status ?? failure.statusCode
      setFeedback({
        tone: 'error',
        message:
          status === 503
            ? 'Fila de jobs indisponível — a sincronização não foi agendada. Verifique o Redis.'
            : 'Não foi possível agendar a sincronização.',
      })
    } finally {
      setPosting(false)
    }
  }

  const feedbackTone: Record<SyncFeedback['tone'], string> = {
    info: T.ink3,
    warn: T.warn,
    error: T.danger,
  }

  const metaRowStyle: CSSProperties = {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 10,
    fontSize: 12.5,
    color: T.faint,
  }

  return (
    <div>
      <Link
        href="/"
        style={{
          fontSize: 13,
          color: T.accent700,
          textDecoration: 'none',
          display: 'inline-block',
          marginBottom: 14,
        }}
      >
        ← Code Hub
      </Link>

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 18,
          flexWrap: 'wrap',
          marginBottom: 18,
        }}
      >
        <div style={{ minWidth: 280 }}>
          <h1 style={{ fontSize: 26, margin: 0, fontFamily: T.mono, letterSpacing: '-0.01em' }}>
            {repo.name}
          </h1>
          {repo.description && (
            <div style={{ fontSize: 13.5, color: T.ink3, marginTop: 6 }}>{repo.description}</div>
          )}
          <div style={metaRowStyle}>
            <Tag>{repo.provider}</Tag>
            <Tag>{repo.is_private ? 'privado' : 'público'}</Tag>
            <span>
              branch <span style={{ fontFamily: T.mono }}>{branch}</span>
            </span>
            <span>·</span>
            <span>atualizado {timeAgo(repo.updated_at)}</span>
            <span>·</span>
            <span style={{ color: repo.owner_team ? T.ink3 : T.warn }}>
              {repo.owner_team ? `time ${repo.owner_team.name}` : 'sem time responsável'}
            </span>
          </div>
        </div>

        <span style={{ flex: 1 }} />

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {canSync && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <Button variant="default" size="md" onClick={handleSync} loading={busy}>
                {repo.sync_status === 'syncing'
                  ? 'Sincronizando…'
                  : queued
                    ? 'Na fila…'
                    : 'Sincronizar agora'}
              </Button>
              {feedback && (
                <span
                  role="status"
                  style={{ fontSize: 11.5, color: feedbackTone[feedback.tone], textAlign: 'right' }}
                >
                  {feedback.message}
                </span>
              )}
            </div>
          )}
          {repo.url && (
            <a
              href={repo.url}
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: 13,
                fontWeight: 600,
                padding: '7px 13px',
                borderRadius: T.radius.button,
                border: `1px solid ${T.border}`,
                background: T.surface,
                color: T.ink,
                textDecoration: 'none',
              }}
            >
              Abrir origem
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
