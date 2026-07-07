'use client'

import { CSSProperties, useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { T } from '@/lib/tokens'
import { MFIcon } from '@/components/icons/MFIcon'
import { Button } from '@/components/ui/Button'
import { apiFetch, AuthError } from '@/lib/api/client'
import { usePublishScope } from '@/components/shell/CoPensadorScopeProvider'
import { CodeIssue, CreatePullRequestReviewResult, PullRequestDetailResponse } from '@/lib/types/pull_request'
import { severityMeta } from '@/lib/severity'
import { buildReviewSubmission } from '@/lib/pr-review'
import { DiffView } from '@/components/pull-requests/DiffView'
import { FindingCard } from '@/components/pull-requests/FindingCard'

interface PullRequestDetailClientProps {
  repoId: string
  prNumber: number
  initialDetail: PullRequestDetailResponse | null
  loadError: string | null
}

const MAX_POLL_TICKS = 45 // ~3 min at 4s
const MAX_CONSECUTIVE_POLL_ERRORS = 3 // stop polling after this many failed checks in a row

export function PullRequestDetailClient({
  repoId,
  prNumber,
  initialDetail,
  loadError,
}: PullRequestDetailClientProps) {
  const [detail, setDetail] = useState<PullRequestDetailResponse | null>(initialDetail)
  const [reviewing, setReviewing] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [pollNotice, setPollNotice] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [publishMsg, setPublishMsg] = useState<string | null>(null)
  const [publishError, setPublishError] = useState<string | null>(null)
  const prevAnalysisIdRef = useRef<string | null>(null)

  usePublishScope(
    { kind: 'repo-pulls', repoId, prNumber, issues: detail?.latest_analysis?.issues },
    [repoId, prNumber, detail?.latest_analysis?.issues]
  )

  const pr = detail?.pull_request
  const analysis = detail?.latest_analysis

  // Poll the detail endpoint while a review is in flight. Stops when a NEW
  // analysis (different id from the one present at trigger time) reaches a
  // terminal status, or after MAX_POLL_TICKS as a safety valve.
  useEffect(() => {
    if (!reviewing) return
    let cancelled = false
    let ticks = 0
    let consecutiveErrors = 0

    const handle = setInterval(async () => {
      ticks += 1
      try {
        const next = await apiFetch<PullRequestDetailResponse>(
          `/api/repositories/${repoId}/pull-requests/${prNumber}`
        )
        if (cancelled) return
        consecutiveErrors = 0
        setDetail(next)
        const a = next.latest_analysis
        const settled =
          !!a &&
          a.id !== prevAnalysisIdRef.current &&
          (a.status === 'completed' || a.status === 'failed')
        if (settled) {
          setReviewing(false)
          return
        }
        if (ticks >= MAX_POLL_TICKS) {
          setReviewing(false)
          setPollNotice('A revisão está demorando mais que o esperado. Atualize a página ou tente revisar novamente.')
        }
      } catch {
        if (cancelled) return
        consecutiveErrors += 1
        if (consecutiveErrors >= MAX_CONSECUTIVE_POLL_ERRORS || ticks >= MAX_POLL_TICKS) {
          setReviewing(false)
          setPollNotice('Não foi possível verificar o status da revisão. Verifique sua conexão e tente novamente.')
        }
      }
    }, 4000)

    return () => {
      cancelled = true
      clearInterval(handle)
    }
  }, [reviewing, repoId, prNumber])

  const triggerReview = useCallback(async () => {
    setActionError(null)
    setPollNotice(null)
    prevAnalysisIdRef.current = detail?.latest_analysis?.id ?? null
    try {
      await apiFetch(`/api/repositories/${repoId}/pull-requests/${prNumber}/analyze`, {
        method: 'POST',
      })
      setReviewing(true)
    } catch (err) {
      // 409 = a review is already queued/running for this PR — just start polling.
      if (err instanceof AuthError && err.status === 409) {
        setReviewing(true)
        return
      }
      setActionError(err instanceof Error ? err.message : 'Falha ao iniciar a revisão.')
    }
  }, [detail, repoId, prNumber])

  const publishToGitHub = useCallback(async () => {
    if (!detail?.latest_analysis) return
    setPublishError(null)
    setPublishMsg(null)
    setPublishing(true)
    try {
      const submission = buildReviewSubmission(
        detail.files,
        detail.latest_analysis.issues,
        detail.latest_analysis.summary_text
      )
      await apiFetch<CreatePullRequestReviewResult>(
        `/api/repositories/${repoId}/pull-requests/${prNumber}/reviews`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(submission) }
      )
      const inline = submission.comments?.length ?? 0
      setPublishMsg(`Review publicado no GitHub (${inline} comentário${inline === 1 ? '' : 's'} inline).`)
    } catch (err) {
      if (err instanceof AuthError && err.status === 403) {
        setPublishError('Publicação de review está desativada. Habilite a revisão de PR nas Configurações da organização.')
      } else {
        setPublishError(err instanceof Error ? err.message : 'Falha ao publicar no GitHub.')
      }
    } finally {
      setPublishing(false)
    }
  }, [detail, repoId, prNumber])

  const pageStyle: CSSProperties = { padding: '20px 24px 28px' }
  const backLinkStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12.5,
    color: T.ink3,
    textDecoration: 'none',
    marginBottom: 14,
  }
  const cardStyle: CSSProperties = {
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.card,
    padding: 16,
    marginBottom: 14,
  }
  const branchPillStyle: CSSProperties = {
    fontFamily: T.mono,
    fontSize: 11.5,
    color: T.ink2,
    background: T.surfaceAlt,
    border: `1px solid ${T.border}`,
    borderRadius: 4,
    padding: '2px 7px',
  }
  const sectionTitleStyle: CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    color: T.ink,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  }

  if (loadError || !pr) {
    return (
      <div style={pageStyle}>
        <Link href={`/code/repositories/${repoId}/pull-requests`} style={backLinkStyle}>
          <MFIcon name="arrow-right" size={12} color={T.ink3} /> Voltar aos PRs
        </Link>
        <div style={{ ...cardStyle, borderColor: T.dangerBorder, background: T.dangerBg, color: T.danger }} role="alert">
          Não foi possível carregar este PR{loadError ? `: ${loadError}` : '.'}
        </div>
      </div>
    )
  }

  const isFailed = analysis?.status === 'failed'
  const isCompleted = analysis?.status === 'completed'
  const hasReview = !!analysis && isCompleted

  // Group findings by changed file so they can be anchored inline in the diff.
  // Findings without a file (or on a file not in the PR diff) fall back to a
  // top-level list so nothing is dropped.
  const files = detail?.files ?? []
  const changedNames = new Set(files.map((f) => f.filename))
  const issuesByFile = new Map<string, CodeIssue[]>()
  const orphanIssues: CodeIssue[] = []
  for (const issue of analysis?.issues ?? []) {
    if (issue.file && changedNames.has(issue.file)) {
      const arr = issuesByFile.get(issue.file) ?? []
      arr.push(issue)
      issuesByFile.set(issue.file, arr)
    } else {
      orphanIssues.push(issue)
    }
  }
  orphanIssues.sort((a, b) => severityMeta(a.severity).order - severityMeta(b.severity).order)

  return (
    <div style={pageStyle}>
      <Link href={`/code/repositories/${repoId}/pull-requests`} style={backLinkStyle}>
        <MFIcon name="arrow-right" size={12} color={T.ink3} /> Voltar aos PRs
      </Link>

      {/* PR identity */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: T.mono, fontSize: 13, color: T.faint }}>#{pr.number}</span>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: T.ink }}>{pr.title}</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: 12, color: T.ink3, flexWrap: 'wrap' }}>
          <span>por {pr.author_login}</span>
          <span style={{ color: T.faint }}>·</span>
          <span style={branchPillStyle}>{pr.head_branch}</span>
          <span style={{ color: T.faint }}>→</span>
          <span style={branchPillStyle}>{pr.base_branch}</span>
          <span style={{ color: T.ok, fontWeight: 600 }}>+{pr.additions_count}</span>
          <span style={{ color: T.danger, fontWeight: 600 }}>-{pr.deletions_count}</span>
          <span>{pr.changed_files} arquivos</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <Button variant="primary" size="md" onClick={triggerReview} disabled={reviewing}>
            <MFIcon name="sparkles" size={13} />
            {reviewing ? 'Revisando…' : hasReview ? 'Revisar de novo' : 'Revisar PR'}
          </Button>
          <a href={pr.html_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
            <Button variant="default" size="md">
              <MFIcon name="arrow-right" size={13} />
              Abrir no GitHub
            </Button>
          </a>
        </div>
        {actionError && (
          <div style={{ marginTop: 10, fontSize: 12.5, color: T.danger }} role="alert">
            {actionError}
          </div>
        )}
      </div>

      {/* Review */}
      <div style={cardStyle}>
        <div style={sectionTitleStyle}>
          <MFIcon name="sparkles" size={14} color={T.ai} />
          Revisão da IA
        </div>

        {pollNotice && !reviewing && (
          <div style={{ fontSize: 12.5, color: T.warn, marginBottom: 10 }} role="alert">
            {pollNotice}
          </div>
        )}

        {reviewing && (
          <div style={{ fontSize: 13, color: T.ink3 }}>
            Revisando o PR… isso pode levar alguns segundos.
          </div>
        )}

        {!reviewing && !analysis && (
          <div style={{ fontSize: 13, color: T.ink3 }}>
            Este PR ainda não foi revisado. Clique em <strong>Revisar PR</strong> para gerar uma
            revisão dos arquivos alterados.
          </div>
        )}

        {!reviewing && isFailed && (
          <div style={{ fontSize: 13, color: T.danger }} role="alert">
            A última revisão falhou{analysis?.error_message ? `: ${analysis.error_message}` : '.'} Tente novamente.
          </div>
        )}

        {!reviewing && hasReview && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {analysis?.summary_text && (
              <div style={{ fontSize: 13, color: T.ink, lineHeight: 1.5 }}>{analysis.summary_text}</div>
            )}
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 12, color: T.ink3 }}>
              <span><strong style={{ color: T.danger }}>{analysis?.critical_count ?? 0}</strong> críticos</span>
              <span><strong style={{ color: T.danger }}>{analysis?.error_count ?? 0}</strong> erros</span>
              <span><strong style={{ color: T.warn }}>{analysis?.warning_count ?? 0}</strong> avisos</span>
              <span><strong>{analysis?.info_count ?? 0}</strong> infos</span>
              {analysis?.ai_model && <span style={{ marginLeft: 'auto', color: T.faint }}>{analysis.ai_model}</span>}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <Button variant="default" size="md" onClick={publishToGitHub} disabled={publishing}>
                <MFIcon name="pr" size={13} />
                {publishing ? 'Publicando…' : 'Publicar no GitHub'}
              </Button>
              {publishMsg && <span style={{ fontSize: 12, color: T.ok }}>{publishMsg}</span>}
              {publishError && <span style={{ fontSize: 12, color: T.danger }}>{publishError}</span>}
            </div>

            {(analysis?.issue_count ?? 0) === 0 && (
              <div style={{ fontSize: 13, color: T.ok }}>Nenhum alerta encontrado nos arquivos alterados. 🎉</div>
            )}

            {orphanIssues.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.ink3 }}>Outros alertas</div>
                {orphanIssues.map((issue, i) => (
                  <FindingCard key={`o${i}`} issue={issue} showLocation />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Diff always renders from the PR files — independent of whether a
          review has run. Findings (when present) are anchored inline. */}
      {files.length > 0 ? (
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>
            <MFIcon name="code" size={14} color={T.accent} />
            Alterações ({files.length} arquivo{files.length === 1 ? '' : 's'})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {files.map((file) => (
              <DiffView key={file.filename} file={file} issues={issuesByFile.get(file.filename) ?? []} />
            ))}
          </div>
        </div>
      ) : (
        <div style={cardStyle}>
          <div style={{ fontSize: 13, color: T.faint }}>Nenhum diff disponível para este PR.</div>
        </div>
      )}
    </div>
  )
}
