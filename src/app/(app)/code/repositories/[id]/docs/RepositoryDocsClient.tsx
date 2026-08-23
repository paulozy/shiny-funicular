'use client'

import { CSSProperties, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { RepositoryResponse } from '@/lib/types/repository'
import { apiFetch } from '@/lib/api/client'
import {
  DOC_TYPES,
  DOC_TYPE_LABELS,
  DocGenerationAcceptedResponse,
  DocGenerationDetail,
  DocGenerationSummary,
  DocType,
  isTerminalDocStatus,
} from '@/lib/types/docs'
import { T } from '@/lib/tokens'
import { DocGenerationCard } from '@/components/docs/DocGenerationCard'
import { DocMarkdownViewer } from '@/components/docs/DocMarkdownViewer'
import { GenerateDocsModal } from '@/components/docs/GenerateDocsModal'
import { Button } from '@/components/ui/Button'

interface RepositoryDocsClientProps {
  repo: RepositoryResponse
  initialDocs: DocGenerationSummary[]
  canGenerate: boolean
}

const POLL_INTERVAL_MS = 5000

/**
 * The repository's own documentation tab.
 *
 * Same generations the Docs hub lists under `?repo=`, but read where the
 * question is asked — nobody looking at a service wants to leave it, pick the
 * repository again from a dropdown, and come back.
 */
export function RepositoryDocsClient({ repo, initialDocs, canGenerate }: RepositoryDocsClientProps) {
  const [docs, setDocs] = useState<DocGenerationSummary[]>(initialDocs)
  const [selectedDocId, setSelectedDocId] = useState<string | null>(initialDocs[0]?.id ?? null)
  const [detail, setDetail] = useState<DocGenerationDetail | null>(null)
  const [activeType, setActiveType] = useState<DocType>('architecture')
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (!selectedDocId) {
      setDetail(null)
      return
    }
    let cancelled = false
    setLoadingDetail(true)
    apiFetch<DocGenerationDetail>(`/api/docs/${selectedDocId}`)
      .then((response) => {
        if (cancelled) return
        setDetail(response)
        const firstWithContent = DOC_TYPES.find((type) => (response.content?.[type] ?? '').trim().length > 0)
        if (firstWithContent) setActiveType(firstWithContent)
      })
      .catch(() => {
        if (!cancelled) setDetail(null)
      })
      .finally(() => {
        if (!cancelled) setLoadingDetail(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedDocId])

  // A generation runs on the backend; the list has to catch up on its own.
  useEffect(() => {
    const inFlight = docs.filter((doc) => !isTerminalDocStatus(doc.status))
    if (inFlight.length === 0) return

    const handle = setInterval(async () => {
      try {
        const refreshed = await Promise.all(
          inFlight.map((doc) => apiFetch<DocGenerationDetail>(`/api/docs/${doc.id}`))
        )
        setDocs((prev) =>
          prev.map((existing) => refreshed.find((next) => next.id === existing.id) ?? existing)
        )
        const current = refreshed.find((next) => next.id === selectedDocId)
        if (current) setDetail(current)
      } catch {
        // Transient: the next tick tries again.
      }
    }, POLL_INTERVAL_MS)

    return () => clearInterval(handle)
  }, [docs, selectedDocId])

  const handleGenerated = useCallback(
    (response: DocGenerationAcceptedResponse) => {
      const stub: DocGenerationSummary = {
        id: response.id,
        organization_id: repo.organization_id,
        scope: 'repo',
        repository_id: repo.id,
        status: response.status,
        types: [],
        tokens_used: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setDocs((prev) => [stub, ...prev])
      setSelectedDocId(response.id)
    },
    [repo.id, repo.organization_id]
  )

  const splitStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '270px minmax(0, 1fr)',
    gap: 22,
    alignItems: 'start',
  }

  const sidebarStyle: CSSProperties = {
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.card,
    padding: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  }

  const railTitleStyle: CSSProperties = {
    fontSize: 11.5,
    letterSpacing: '.08em',
    textTransform: 'uppercase',
    color: T.faint,
    padding: '8px 10px 6px',
  }

  const panelStyle: CSSProperties = {
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.card,
    minHeight: 380,
    overflow: 'hidden',
  }

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

  const generating = detail !== null && !isTerminalDocStatus(detail.status)

  return (
    <div style={splitStyle}>
      <aside style={sidebarStyle} aria-label="Gerações de documentação do repositório">
        <div style={railTitleStyle}>Gerado por IA</div>

        {docs.length === 0 ? (
          <div style={{ padding: '4px 10px 10px', fontSize: 12.5, color: T.faint, lineHeight: 1.5 }}>
            Nada gerado para este repositório ainda.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {docs.map((doc) => (
              <DocGenerationCard
                key={doc.id}
                summary={doc}
                active={doc.id === selectedDocId}
                onSelect={(next) => setSelectedDocId(next.id)}
              />
            ))}
          </div>
        )}

        {canGenerate && (
          <div style={{ padding: '8px 2px 2px' }}>
            <Button
              variant="default"
              size="md"
              style={{ width: '100%' }}
              onClick={() => setShowModal(true)}
            >
              Gerar documentação
            </Button>
          </div>
        )}

        <Link
          href={`/docs?repo=${repo.id}`}
          style={{ fontSize: 12.5, color: T.accent700, padding: '4px 10px', textDecoration: 'none' }}
        >
          Ver no hub de documentação →
        </Link>
      </aside>

      <section style={panelStyle}>
        <div style={{ display: 'flex', gap: 18, padding: '12px 18px', borderBottom: `1px solid ${T.border}` }}>
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

        {!selectedDocId ? (
          <div style={{ padding: '40px 18px', textAlign: 'center', fontSize: 13.5, color: T.faint }}>
            Nenhuma documentação gerada para {repo.name}.
            {canGenerate ? ' Gere a primeira ao lado.' : ''}
          </div>
        ) : loadingDetail ? (
          <div style={{ padding: '40px 18px', textAlign: 'center', fontSize: 13.5, color: T.faint }}>
            Carregando…
          </div>
        ) : !detail ? (
          <div style={{ padding: '40px 18px', textAlign: 'center', fontSize: 13.5, color: T.faint }}>
            Não foi possível carregar o conteúdo.
          </div>
        ) : generating ? (
          <div style={{ padding: '40px 18px', textAlign: 'center', fontSize: 13.5, color: T.faint }}>
            Lendo o repositório e escrevendo os documentos… esta página atualiza sozinha.
          </div>
        ) : (
          <>
            {detail.error_message && (
              <div
                style={{
                  padding: '10px 18px',
                  background: T.dangerBg,
                  borderBottom: `1px solid ${T.dangerBorder}`,
                  color: T.danger,
                  fontSize: 12.5,
                }}
                role="alert"
              >
                {detail.error_message}
              </div>
            )}
            <DocMarkdownViewer content={detail.content?.[activeType] ?? ''} />
          </>
        )}
      </section>

      <GenerateDocsModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        repoId={repo.id}
        defaultBranch={repo.metadata?.default_branch}
        onSuccess={handleGenerated}
      />
    </div>
  )
}
