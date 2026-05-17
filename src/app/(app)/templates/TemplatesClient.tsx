'use client'

import { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserInfo } from '@/lib/types/auth'
import {
  CodeTemplate,
  TemplateAcceptedResponse,
  TemplateListResponse,
  TemplateStatus,
  isTerminalTemplateStatus,
} from '@/lib/types/template'
import { apiFetch } from '@/lib/api/client'
import { T } from '@/lib/tokens'
import { AppShell } from '@/components/shell/AppShell'
import { CodeHubTabBar } from '@/components/shell/CodeHubTabBar'
import { Button } from '@/components/ui/Button'
import { MFIcon } from '@/components/icons/MFIcon'
import { TemplateCard } from '@/components/templates/TemplateCard'
import { GenerateTemplateModal } from '@/components/templates/GenerateTemplateModal'

interface TemplatesClientProps {
  user: UserInfo
  initialTemplates: TemplateListResponse
}

type StatusFilter = 'all' | TemplateStatus
const POLL_INTERVAL_MS = 2500

export function TemplatesClient({ user, initialTemplates }: TemplatesClientProps) {
  const router = useRouter()
  const [templates, setTemplates] = useState<CodeTemplate[]>(initialTemplates.templates)
  const [pinnedOnly, setPinnedOnly] = useState(false)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [filterText, setFilterText] = useState('')
  const [showModal, setShowModal] = useState(false)

  // Poll any non-terminal templates until they settle.
  const pollIntervalsRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map())
  useEffect(() => {
    const intervals = pollIntervalsRef.current
    const active = templates.filter((t) => !isTerminalTemplateStatus(t.status))
    for (const t of active) {
      if (intervals.has(t.id)) continue
      const handle = setInterval(async () => {
        try {
          const next = await apiFetch<CodeTemplate>(`/api/templates/${t.id}`, { method: 'GET' })
          setTemplates((prev) => prev.map((existing) => (existing.id === next.id ? next : existing)))
          if (isTerminalTemplateStatus(next.status)) {
            const handle = intervals.get(t.id)
            if (handle) clearInterval(handle)
            intervals.delete(t.id)
          }
        } catch {
          // swallow — next tick retries
        }
      }, POLL_INTERVAL_MS)
      intervals.set(t.id, handle)
    }
    // Stop intervals for templates that are no longer pending/generating or got removed.
    for (const [id, handle] of intervals.entries()) {
      const template = templates.find((t) => t.id === id)
      if (!template || isTerminalTemplateStatus(template.status)) {
        clearInterval(handle)
        intervals.delete(id)
      }
    }
    return () => {
      for (const handle of intervals.values()) clearInterval(handle)
      intervals.clear()
    }
    // We re-evaluate intervals whenever the template list changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templates.map((t) => `${t.id}:${t.status}`).join('|')])

  const filtered = useMemo(() => {
    return templates.filter((t) => {
      if (pinnedOnly && !t.is_pinned) return false
      if (statusFilter !== 'all' && t.status !== statusFilter) return false
      if (filterText.trim()) {
        const needle = filterText.trim().toLowerCase()
        const haystack = `${t.name ?? ''} ${t.summary ?? ''} ${t.prompt}`.toLowerCase()
        if (!haystack.includes(needle)) return false
      }
      return true
    })
  }, [templates, pinnedOnly, statusFilter, filterText])

  const handleGenerated = useCallback(
    (response: TemplateAcceptedResponse) => {
      // After enqueueing, navigate to the detail page. The poller there picks
      // up status until completion.
      router.push(`/templates/${response.id}`)
    },
    [router]
  )

  const handleTemplateUpdated = useCallback((next: CodeTemplate) => {
    setTemplates((prev) => prev.map((t) => (t.id === next.id ? next : t)))
  }, [])

  const contentStyle: CSSProperties = { padding: '20px 24px 28px' }

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 14,
    marginBottom: 18,
  }

  const eyebrowStyle: CSSProperties = {
    fontSize: 10.5,
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: T.faint,
    marginBottom: 4,
  }

  const titleStyle: CSSProperties = {
    fontSize: 22,
    fontWeight: 600,
    letterSpacing: '-0.01em',
    margin: 0,
  }

  const filtersStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    flexWrap: 'wrap',
  }

  const filterInputStyle: CSSProperties = {
    appearance: 'none',
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.input,
    background: T.surface,
    color: T.ink,
    padding: '6px 10px',
    fontSize: 12.5,
    fontFamily: T.font,
    minWidth: 240,
  }

  const chipStyle = (active: boolean): CSSProperties => ({
    appearance: 'none',
    border: `1px solid ${active ? T.accent : T.borderStrong}`,
    background: active ? T.accentBg : T.surface,
    color: active ? T.accent : T.ink2,
    padding: '5px 12px',
    borderRadius: T.radius.button,
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
  })

  const gridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 12,
  }

  return (
    <AppShell
      user={user}
      activeHub="code"
      breadcrumb={[{ label: 'Code', href: '/' }, { label: 'Templates' }]}
      topRight={
        <Button variant="primary" size="md" onClick={() => setShowModal(true)}>
          <MFIcon name="sparkles" size={12} />
          Gerar template
        </Button>
      }
    >
      <CodeHubTabBar activeTab="templates" />
      <div style={contentStyle}>
        <div style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>Code Hub · {templates.length} templates</div>
            <h1 style={titleStyle}>Templates</h1>
          </div>
        </div>

        <div style={filtersStyle}>
          <input
            type="search"
            placeholder="Filtrar por nome, prompt ou resumo…"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            style={filterInputStyle}
            aria-label="Filtrar templates"
          />
          <button
            type="button"
            style={chipStyle(pinnedOnly)}
            onClick={() => setPinnedOnly((v) => !v)}
          >
            Fixados
          </button>
          {(['all', 'completed', 'generating', 'pending', 'failed'] as StatusFilter[]).map((s) => (
            <button
              key={s}
              type="button"
              style={chipStyle(statusFilter === s)}
              onClick={() => setStatusFilter(s)}
            >
              {s === 'all' ? 'Todos' : s === 'completed' ? 'Concluídos' : s === 'generating' ? 'Gerando' : s === 'pending' ? 'Pendentes' : 'Falharam'}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div
            style={{
              padding: 48,
              textAlign: 'center',
              color: T.faint,
              fontSize: 13,
              border: `1px dashed ${T.border}`,
              borderRadius: T.radius.card,
            }}
          >
            Nenhum template ainda. Clique em <strong>Gerar template</strong> para criar o primeiro.
          </div>
        ) : (
          <div style={gridStyle}>
            {filtered.map((template) => (
              <TemplateCard key={template.id} template={template} onUpdated={handleTemplateUpdated} />
            ))}
          </div>
        )}
      </div>

      <GenerateTemplateModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleGenerated}
      />
    </AppShell>
  )
}
