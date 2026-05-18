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
import { CodeHubTabBar } from '@/components/shell/CodeHubTabBar'
import { DocGenerationCard } from '@/components/docs/DocGenerationCard'
import { DocMarkdownViewer } from '@/components/docs/DocMarkdownViewer'
import { GenerateDocsModal } from '@/components/docs/GenerateDocsModal'
import { Button } from '@/components/ui/Button'
import { MFIcon } from '@/components/icons/MFIcon'

interface DocsClientProps {
  user: UserInfo
  repos: RepositoryResponse[]
  initialSelectedRepoId: string | null
  initialDocs: DocGenerationListResponse
}

const POLL_INTERVAL_MS = 5000

export function DocsClient({ user, repos, initialSelectedRepoId, initialDocs }: DocsClientProps) {
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
    gap: 12,
    padding: '12px 24px',
    borderBottom: `1px solid ${T.border}`,
    background: T.surface,
  }

  const selectStyle: CSSProperties = {
    appearance: 'none',
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.input,
    background: T.surface,
    color: T.ink,
    padding: '6px 10px',
    fontSize: 12.5,
    minWidth: 240,
  }

  const splitStyle: CSSProperties = {
    flex: 1,
    display: 'flex',
    minHeight: 0,
  }

  const sidebarStyle: CSSProperties = {
    width: 300,
    minWidth: 260,
    background: T.surface,
    borderRight: `1px solid ${T.border}`,
    overflow: 'auto',
    padding: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  }

  const mainStyle: CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  }

  const tabsContainerStyle: CSSProperties = {
    display: 'flex',
    gap: 4,
    padding: '8px 24px',
    borderBottom: `1px solid ${T.border}`,
    background: T.surface,
  }

  const tabButtonStyle = (active: boolean): CSSProperties => ({
    appearance: 'none',
    border: 0,
    background: 'transparent',
    color: active ? T.ink : T.ink2,
    fontWeight: active ? 600 : 500,
    fontSize: 12.5,
    padding: '8px 12px',
    borderBottom: `2px solid ${active ? T.accent : 'transparent'}`,
    marginBottom: -1,
    cursor: 'pointer',
  })

  const bannerStyle: CSSProperties = {
    padding: '10px 24px',
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
      breadcrumb={[{ label: 'Code', href: '/' }, { label: 'Documentação' }]}
      topRight={
        selectedRepoId && (
          <Button variant="primary" size="md" onClick={() => setShowModal(true)}>
            <MFIcon name="sparkles" size={12} />
            Gerar documentação
          </Button>
        )
      }
    >
      <CodeHubTabBar activeTab="docs" />

      <div style={headerStyle}>
        <span style={{ fontSize: 12.5, color: T.ink2 }}>Repositório:</span>
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
            style={{ marginLeft: 'auto', fontSize: 12, color: T.accent, textDecoration: 'none' }}
          >
            Ver repositório →
          </Link>
        )}
      </div>

      <div style={splitStyle}>
        <aside style={sidebarStyle} aria-label="Lista de gerações">
          {docs.length === 0 ? (
            <div style={{ padding: 16, color: T.faint, fontSize: 12.5, textAlign: 'center' }}>
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
              <div style={{ padding: 48, textAlign: 'center', color: T.faint, fontSize: 13 }}>
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
