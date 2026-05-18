'use client'

import { CSSProperties, useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserInfo } from '@/lib/types/auth'
import { apiFetch } from '@/lib/api/client'
import {
  DOC_PROGRESS_LABELS,
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
import { DocsScopeTabs } from '@/components/docs/DocsScopeTabs'
import { DocMarkdownViewer } from '@/components/docs/DocMarkdownViewer'
import { OrgDocsTemplateModal } from '@/components/docs/OrgDocsTemplateModal'
import { Button } from '@/components/ui/Button'
import { MFIcon } from '@/components/icons/MFIcon'

interface DocsOrgClientProps {
  user: UserInfo
  initialDocs: DocGenerationListResponse
  initialDocDetail: DocGenerationDetail | null
}

const POLL_INTERVAL_MS = 5000

export function DocsOrgClient({ user, initialDocs, initialDocDetail }: DocsOrgClientProps) {
  const router = useRouter()
  const [docs, setDocs] = useState<DocGenerationSummary[]>(initialDocs.items)
  const [selectedDocId, setSelectedDocId] = useState<string | null>(initialDocDetail?.id ?? initialDocs.items[0]?.id ?? null)
  const [docDetail, setDocDetail] = useState<DocGenerationDetail | null>(initialDocDetail)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [activeType, setActiveType] = useState<DocType | null>(null)
  const [showModal, setShowModal] = useState(false)

  const canManage = user.organization?.role === 'admin'

  // Whenever the selected doc changes, fetch its full detail (content blob).
  useEffect(() => {
    if (!selectedDocId) {
      setDocDetail(null)
      return
    }
    if (docDetail?.id === selectedDocId) {
      // Skip if we already have it (e.g. SSR delivered it).
      return
    }
    let cancelled = false
    setLoadingDetail(true)
    apiFetch<DocGenerationDetail>(`/api/docs/${selectedDocId}`, { method: 'GET' })
      .then((next) => {
        if (cancelled) return
        setDocDetail(next)
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
  }, [selectedDocId, docDetail?.id])

  // Pick the first type that actually has content whenever the detail loads.
  useEffect(() => {
    if (!docDetail?.content) {
      setActiveType(null)
      return
    }
    const firstWithContent = (Object.keys(docDetail.content) as DocType[]).find(
      (t) => (docDetail.content?.[t] ?? '').trim().length > 0
    )
    setActiveType(firstWithContent ?? null)
  }, [docDetail])

  // Poll the docs that are still being generated so the sidebar reflects
  // progress without forcing a manual refresh.
  useEffect(() => {
    const pending = docs.filter((d) => !isTerminalDocStatus(d.status))
    if (pending.length === 0) return
    const handle = setInterval(async () => {
      try {
        const refreshed = await Promise.all(
          pending.map((d) => apiFetch<DocGenerationDetail>(`/api/docs/${d.id}`, { method: 'GET' }))
        )
        setDocs((prev) =>
          prev.map((existing) => {
            const next = refreshed.find((r) => r.id === existing.id)
            return next ?? existing
          })
        )
        const focused = refreshed.find((r) => r.id === selectedDocId)
        if (focused) setDocDetail(focused)
      } catch {
        /* transient — try again next tick */
      }
    }, POLL_INTERVAL_MS)
    return () => clearInterval(handle)
  }, [docs, selectedDocId])

  const handleGenerated = useCallback((response: DocGenerationAcceptedResponse) => {
    // Add an optimistic stub at the top of the list so the user immediately
    // sees the new generation row. The poller will fill in the rest.
    const stub: DocGenerationSummary = {
      id: response.id,
      organization_id: user.organization?.id ?? '',
      scope: 'org',
      status: response.status,
      types: [],
      tokens_used: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setDocs((prev) => [stub, ...prev])
    setSelectedDocId(response.id)
    router.replace(`/docs?scope=org&doc=${response.id}`)
  }, [router, user.organization?.id])

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

  return (
    <AppShell
      user={user}
      activeHub="code"
      breadcrumb={[{ label: 'Code', href: '/' }, { label: 'Documentação', href: '/docs' }, { label: 'Organização' }]}
      topRight={
        canManage && (
          <Button variant="primary" size="md" onClick={() => setShowModal(true)}>
            <MFIcon name="sparkles" size={12} />
            Gerar documentação
          </Button>
        )
      }
    >
      <CodeHubTabBar activeTab="docs" />
      <DocsScopeTabs active="org" />

      <div style={splitStyle}>
        <aside style={sidebarStyle} aria-label="Lista de gerações da organização">
          {docs.length === 0 ? (
            <div style={{ padding: 16, color: T.faint, fontSize: 12.5, textAlign: 'center' }}>
              Nenhuma documentação organizacional gerada ainda.
            </div>
          ) : (
            docs.map((d) => <OrgDocCard key={d.id} summary={d} active={d.id === selectedDocId} onSelect={(next) => setSelectedDocId(next.id)} />)
          )}
        </aside>

        <main style={mainStyle}>
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

          {docDetail && isTerminalDocStatus(docDetail.status) && Object.keys(docDetail.content ?? {}).length > 0 && (
            <div style={tabsContainerStyle}>
              {(Object.keys(docDetail.content ?? {}) as DocType[]).map((type) => (
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
          )}

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
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  color: T.faint,
                  fontSize: 13,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <MFIcon name="sparkles" size={14} color={T.ai} />
                  {docDetail.progress_stage
                    ? DOC_PROGRESS_LABELS[docDetail.progress_stage as keyof typeof DOC_PROGRESS_LABELS] ?? 'Gerando…'
                    : 'Gerando…'}
                </div>
                <div style={{ fontSize: 11.5 }}>Esta página atualiza automaticamente.</div>
              </div>
            ) : (
              <DocMarkdownViewer content={activeType ? docDetail.content?.[activeType] ?? '' : ''} />
            )}
          </div>
        </main>
      </div>

      <OrgDocsTemplateModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleGenerated}
      />
    </AppShell>
  )
}

// OrgDocCard is a compact sidebar entry. It diverges from DocGenerationCard
// (repo scope) because the org variant has no PR # and shows the template
// label instead.
function OrgDocCard({ summary, active, onSelect }: { summary: DocGenerationSummary; active: boolean; onSelect: (s: DocGenerationSummary) => void }) {
  const tone =
    summary.status === 'completed'
      ? T.ok
      : summary.status === 'failed'
        ? T.danger
        : summary.status === 'in_progress'
          ? T.accent
          : T.faint

  return (
    <button
      type="button"
      onClick={() => onSelect(summary)}
      style={{
        appearance: 'none',
        border: `1px solid ${active ? T.accent : T.border}`,
        borderRadius: 8,
        padding: '10px 12px',
        background: active ? T.accentBg : T.surface,
        color: T.ink,
        width: '100%',
        textAlign: 'left',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600 }}>
        <span style={{ width: 6, height: 6, borderRadius: 999, background: tone }} />
        {new Date(summary.created_at).toLocaleString('pt-BR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        <span style={{ marginLeft: 'auto', fontSize: 11, color: tone }}>
          {summary.status === 'completed' ? 'Concluído' : summary.status === 'failed' ? 'Falhou' : summary.status === 'in_progress' ? 'Gerando…' : 'Pendente'}
        </span>
      </div>
      <div style={{ fontSize: 11.5, color: T.ink3 }}>
        {summary.types.map((t) => DOC_TYPE_LABELS[t]).join(' · ') || '—'}
      </div>
      {summary.template_id && (
        <div style={{ fontSize: 10.5, color: T.faint, fontFamily: T.mono }}>{summary.template_id}</div>
      )}
    </button>
  )
}
