'use client'

import { CSSProperties, useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { UserInfo } from '@/lib/types/auth'
import { RepositoryResponse } from '@/lib/types/repository'
import { apiFetch } from '@/lib/api/client'
import {
  DOC_TYPES,
  DOC_TYPE_LABELS,
  DocGenerationAcceptedResponse,
  DocGenerationDetail,
  DocGenerationListResponse,
  DocGenerationSummary,
  DocType,
  isTerminalDocStatus,
} from '@/lib/types/docs'
import { T } from '@/lib/tokens'
import { AppShell } from '@/components/shell/AppShell'
import { DocsScopeTabs } from '@/components/docs/DocsScopeTabs'
import { DocGenerationCard } from '@/components/docs/DocGenerationCard'
import { DocMarkdownViewer } from '@/components/docs/DocMarkdownViewer'
import { GenerateDocsModal } from '@/components/docs/GenerateDocsModal'
import { Button } from '@/components/ui/Button'
import { canGenerateDocs } from '@/lib/permissions'
import { MFIcon } from '@/components/icons/MFIcon'

interface DocsRepoClientProps {
  user: UserInfo
  repos: RepositoryResponse[]
  initialSelectedRepoId: string | null
  initialDocs: DocGenerationListResponse
}

const POLL_INTERVAL_MS = 5000

export function DocsRepoClient({ user, repos, initialSelectedRepoId, initialDocs }: DocsRepoClientProps) {
  const router = useRouter()
  const [selectedRepoId, setSelectedRepoId] = useState<string | null>(initialSelectedRepoId)
  const [docs, setDocs] = useState<DocGenerationSummary[]>(initialDocs.items)
  const [selectedDocId, setSelectedDocId] = useState<string | null>(initialDocs.items[0]?.id ?? null)
  const [docDetail, setDocDetail] = useState<DocGenerationDetail | null>(null)
  const [activeType, setActiveType] = useState<DocType>('architecture')
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const selectedRepo = useMemo(
    () => repos.find((r) => r.id === selectedRepoId) ?? null,
    [repos, selectedRepoId]
  )

  // Reload docs list whenever the repo changes.
  useEffect(() => {
    if (!selectedRepoId) {
      setDocs([])
      setSelectedDocId(null)
      return
    }
    let cancelled = false
    apiFetch<DocGenerationListResponse>(`/api/repositories/${selectedRepoId}/docs`, {
      method: 'GET',
    })
      .then((response) => {
        if (cancelled) return
        setDocs(response.items)
        setSelectedDocId(response.items[0]?.id ?? null)
      })
      .catch(() => {
        if (!cancelled) setDocs([])
      })
    return () => {
      cancelled = true
    }
  }, [selectedRepoId])

  // Load the detailed doc whenever the selected doc changes.
  useEffect(() => {
    if (!selectedDocId) {
      setDocDetail(null)
      return
    }
    let cancelled = false
    setLoadingDetail(true)
    apiFetch<DocGenerationDetail>(`/api/docs/${selectedDocId}`, { method: 'GET' })
      .then((response) => {
        if (cancelled) return
        setDocDetail(response)
        // Auto-pick the first type that actually has content.
        const firstWithContent = DOC_TYPES.find((t) => (response.content?.[t] ?? '').trim().length > 0)
        if (firstWithContent) setActiveType(firstWithContent)
      })
      .catch(() => {
        if (!cancelled) setDocDetail(null)
      })
      .finally(() => {
        if (!cancelled) setLoadingDetail(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedDocId])

  // Poll non-terminal docs in the list at 5s.
  useEffect(() => {
    const inFlight = docs.filter((d) => !isTerminalDocStatus(d.status))
    if (inFlight.length === 0) return
    const handle = setInterval(async () => {
      try {
        const refreshed = await Promise.all(
          inFlight.map((d) => apiFetch<DocGenerationDetail>(`/api/docs/${d.id}`, { method: 'GET' }))
        )
        setDocs((prev) =>
          prev.map((existing) => {
            const next = refreshed.find((r) => r.id === existing.id)
            return next ?? existing
          })
        )
        // If the currently selected doc just completed, refresh its detail too.
        const currentDetail = refreshed.find((r) => r.id === selectedDocId)
        if (currentDetail) setDocDetail(currentDetail)
      } catch {
        // tolerate transient errors
      }
    }, POLL_INTERVAL_MS)
    return () => clearInterval(handle)
  }, [docs, selectedDocId])

  const handleGenerated = useCallback(
    (response: DocGenerationAcceptedResponse) => {
      // Optimistically add the new generation to the top of the list.
      const stub: DocGenerationSummary = {
        id: response.id,
        organization_id: user.organization?.id ?? '',
        scope: 'repo',
        repository_id: selectedRepoId!,
        status: response.status,
        types: [],
        tokens_used: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setDocs((prev) => [stub, ...prev])
      setSelectedDocId(response.id)
    },
    [selectedRepoId]
  )

  const handleRepoChange = (id: string) => {
    setSelectedRepoId(id)
    const url = new URL(window.location.href)
    url.searchParams.set('repo', id)
    router.replace(url.pathname + url.search)
  }

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    flexWrap: 'wrap',
    marginBottom: 20,
  }

  const selectStyle: CSSProperties = {
    appearance: 'none',
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.input,
    background: T.surface,
    color: T.ink,
    padding: '7px 12px',
    fontSize: 13,
    minWidth: 240,
    cursor: 'pointer',
  }

  const splitStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '260px minmax(0, 1fr)',
    gap: 20,
    alignItems: 'start',
  }

  const sidebarStyle: CSSProperties = {
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.card,
    padding: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  }

  const mainStyle: CSSProperties = {
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.card,
    minHeight: 380,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    overflow: 'hidden',
  }

  const tabsContainerStyle: CSSProperties = {
    display: 'flex',
    gap: 18,
    padding: '12px 18px',
    borderBottom: `1px solid ${T.border}`,
  }

  const mayGenerate = canGenerateDocs(user)

  const tabButtonStyle = (active: boolean): CSSProperties => ({
    appearance: 'none',
    border: 0,
    background: 'transparent',
    color: active ? T.ink : T.faint,
    fontWeight: active ? 600 : 500,
    fontSize: 13,
    padding: '0 0 4px',
    borderBottom: `2px solid ${active ? T.accent : 'transparent'}`,
    cursor: 'pointer',
  })

  const bannerStyle: CSSProperties = {
    padding: '10px 18px',
    background: T.aiBg,
    borderBottom: `1px solid ${T.aiBorder}`,
    fontSize: 12,
    color: T.ink2,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  }

  return (
    <AppShell
      user={user}
      activeHub="code"
      codeTab="docs"
      topRight={
        selectedRepoId &&
        mayGenerate && (
          <Button variant="primary" size="md" onClick={() => setShowModal(true)}>
            Gerar documentação
          </Button>
        )
      }
    >
      <h1 style={{ fontSize: 26, margin: '0 0 6px' }}>Documentação</h1>
      <p style={{ fontSize: 14, color: T.ink3, margin: '0 0 20px' }}>
        Gerada a partir do código pelos agentes da organização.
      </p>

      <div style={headerStyle}>
        <DocsScopeTabs active="repo" />
        <select
          style={selectStyle}
          value={selectedRepoId ?? ''}
          onChange={(e) => handleRepoChange(e.target.value)}
          aria-label="Selecionar repositório"
        >
          <option value="" disabled>
            Selecione um repositório
          </option>
          {repos.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        {selectedRepo && (
          <Link
            href={`/code/repositories/${selectedRepo.id}`}
            style={{ fontSize: 13, color: T.accent700, textDecoration: 'none' }}
          >
            Ver repositório →
          </Link>
        )}
      </div>

      <div style={splitStyle}>
        <aside style={sidebarStyle} aria-label="Lista de gerações">
          {docs.length === 0 ? (
            <div style={{ padding: 10, color: T.faint, fontSize: 13, lineHeight: 1.5 }}>
              Nenhuma documentação gerada para este repositório.
            </div>
          ) : (
            docs.map((d) => (
              <DocGenerationCard
                key={d.id}
                summary={d}
                active={d.id === selectedDocId}
                onSelect={(next) => setSelectedDocId(next.id)}
              />
            ))
          )}
        </aside>

        <main style={mainStyle}>
          {docDetail?.pull_request_url && (
            <div style={bannerStyle}>
              <MFIcon name="pr" size={13} color={T.ai} />
              <span>
                {docDetail.pull_request_number
                  ? `PR #${docDetail.pull_request_number}`
                  : 'Pull Request'}{' '}
                aberta no GitHub
              </span>
              {docDetail.gen_branch && (
                <span style={{ fontFamily: T.mono, fontSize: 11.5 }}>
                  branch: {docDetail.gen_branch}
                </span>
              )}
              <a
                href={docDetail.pull_request_url}
                target="_blank"
                rel="noreferrer"
                style={{ marginLeft: 'auto', color: T.accent, fontSize: 12 }}
              >
                Abrir no GitHub →
              </a>
            </div>
          )}

          {docDetail?.error_message && (
            <div
              style={{
                padding: '10px 24px',
                background: T.dangerBg,
                borderBottom: `1px solid ${T.dangerBorder}`,
                color: T.danger,
                fontSize: 12.5,
              }}
            >
              {docDetail.error_message}
            </div>
          )}

          <div style={tabsContainerStyle}>
            {DOC_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setActiveType(type)}
                style={tabButtonStyle(activeType === type)}
              >
                {DOC_TYPE_LABELS[type]}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflow: 'auto' }}>
            {!selectedDocId ? (
              <div style={{ padding: '40px 18px', textAlign: 'center', color: T.faint, fontSize: 13.5 }}>
                Selecione uma geração à esquerda ou clique em &quot;Gerar documentação&quot;.
              </div>
            ) : loadingDetail ? (
              <div style={{ padding: 48, textAlign: 'center', color: T.faint, fontSize: 13 }}>
                Carregando…
              </div>
            ) : !docDetail ? (
              <div style={{ padding: 48, textAlign: 'center', color: T.faint, fontSize: 13 }}>
                Não foi possível carregar o conteúdo.
              </div>
            ) : !isTerminalDocStatus(docDetail.status) ? (
              <div
                style={{
                  padding: 48,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  color: T.faint,
                  fontSize: 13,
                }}
              >
                <MFIcon name="sparkles" size={14} color={T.ai} />
                A documentação está sendo gerada. Esta página atualiza automaticamente.
              </div>
            ) : (
              <DocMarkdownViewer content={docDetail.content?.[activeType] ?? ''} />
            )}
          </div>
        </main>
      </div>

      {selectedRepoId && (
        <GenerateDocsModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          repoId={selectedRepoId}
          defaultBranch={selectedRepo?.metadata?.default_branch}
          onSuccess={handleGenerated}
        />
      )}
    </AppShell>
  )
}
