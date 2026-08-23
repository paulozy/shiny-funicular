'use client'

import { CSSProperties, FormEvent, useEffect, useState } from 'react'
import { T } from '@/lib/tokens'
import { apiFetch } from '@/lib/api/client'
import {
  DocGenerationAcceptedResponse,
  DocGenerationSummary,
  DocTemplate,
  DocType,
  GenerateDocsRequest,
} from '@/lib/types/docs'
import { MFIcon } from '@/components/icons/MFIcon'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { DocTemplateCard, DocTemplateDetail } from '@/components/docs/DocTemplateCard'

interface GenerateDocsModalProps {
  isOpen: boolean
  onClose: () => void
  repoId: string
  defaultBranch?: string
  /**
   * What this repository already has, so each type can say whether generating
   * would create or replace. The callers already hold this list.
   */
  existingDocs?: DocGenerationSummary[]
  onSuccess: (response: DocGenerationAcceptedResponse) => void
}

export function GenerateDocsModal({
  isOpen,
  onClose,
  repoId,
  defaultBranch,
  existingDocs = [],
  onSuccess,
}: GenerateDocsModalProps) {
  // Selection is keyed by template **id**, not by type.
  //
  // Type is not a key: the four org ADR templates all carry `type: 'adr'`, so
  // keying on it made one click select every card sharing a type. That was
  // invisible while this gallery only ever saw one template per type, and
  // became visible the moment an unfiltered list reached it.
  //
  // Nothing pre-selected, deliberately. A pre-checked option reads as a
  // recommendation, and the worker makes one Claude call per selected type
  // against the organization's hourly budget — so a default of "all four"
  // spends four calls on documents the reader has not been told about, and
  // lands four files (including a root CONTRIBUTING.md) in one pull request.
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [branch, setBranch] = useState(defaultBranch ?? '')
  const [templates, setTemplates] = useState<DocTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    // Scope is explicit: without it the registry returns org templates too,
    // and this gallery would offer documents that have no repository to land in.
    apiFetch<DocTemplate[]>('/api/docs/templates?scope=repo')
      .then((response) => {
        // Filtered again here, not out of distrust of the query but because the
        // endpoint answers with everything when it does not recognize the
        // parameter — which is exactly what an older server does. A document
        // with no repository to land in must never be offered on this screen.
        if (!cancelled) setTemplates(response.filter((t) => t.scope === 'repo'))
      })
      .catch(() => {
        // The gallery degrades to nothing rather than to unlabelled checkboxes:
        // offering a choice with no explanation is the state this replaced.
        if (!cancelled) setError('Não foi possível carregar os tipos de documentação.')
      })
    return () => {
      cancelled = true
    }
  }, [isOpen])

  // Reset between openings so a cancelled selection does not come back.
  useEffect(() => {
    if (!isOpen) {
      setSelected(new Set())
      setError(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const toggle = (templateID: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(templateID)) next.delete(templateID)
      else next.add(templateID)
      return next
    })
  }

  // The API takes types, so the selected ids are mapped back and deduped —
  // two templates of the same type would otherwise ask for it twice.
  const selectedTypes = (): DocType[] => {
    const types = templates.filter((t) => selected.has(t.id)).map((t) => t.type as DocType)
    return Array.from(new Set(types))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (selected.size === 0) {
      setError('Selecione ao menos um tipo de documentação.')
      return
    }
    setLoading(true)
    try {
      const body: GenerateDocsRequest = {
        types: selectedTypes(),
        branch: branch.trim() || undefined,
      }
      const response = await apiFetch<DocGenerationAcceptedResponse>(
        `/api/repositories/${repoId}/docs`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      )
      onSuccess(response)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar documentação')
    } finally {
      setLoading(false)
    }
  }

  const overlayStyle: CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: T.overlay,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  }

  const modalStyle: CSSProperties = {
    width: 560,
    maxHeight: '90vh',
    background: T.surfaceOverlay,
    border: `1px solid ${T.borderStrong}`,
    borderRadius: T.radius.dialog,
    boxShadow: T.shadow,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  }

  return (
    <div
      style={overlayStyle}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Gerar documentação"
    >
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div
          style={{
            padding: '14px 16px',
            borderBottom: `1px solid ${T.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <MFIcon name="sparkles" size={14} color={T.ai} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>Gerar documentação</span>
          <button
            onClick={onClose}
            aria-label="Fechar modal"
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: T.faint,
              fontSize: 20,
              padding: 0,
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: 20, overflow: 'auto', flex: 1 }}>
          {error && <Alert variant="danger">{error}</Alert>}

          <p style={{ fontSize: 12.5, color: T.ink3, margin: '0 0 14px', lineHeight: 1.5 }}>
            Cada tipo selecionado gera um arquivo, entregue como pull request no repositório.
          </p>

          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {templates.map((template) => (
                <DocTemplateCard
                  key={template.id}
                  template={template}
                  selected={selected.has(template.id)}
                  onSelect={() => toggle(template.id)}
                  trailing={
                    <ExistingBadge
                      hasDoc={hasGeneratedType(existingDocs, template.type as DocType)}
                    />
                  }
                >
                  <DocTemplateDetail template={template} />
                </DocTemplateCard>
              ))}
            </div>

            <Input
              label="Branch (opcional)"
              placeholder={defaultBranch || 'main'}
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
            />
          </form>
        </div>

        <div
          style={{
            padding: '12px 16px',
            borderTop: `1px solid ${T.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            justifyContent: 'flex-end',
          }}
        >
          <span style={{ fontSize: 12, color: T.faint, marginRight: 'auto' }}>
            {selected.size === 0
              ? 'Nenhum tipo selecionado'
              : `${selected.size} ${selected.size === 1 ? 'arquivo' : 'arquivos'} neste PR`}
          </span>
          <Button variant="default" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            Gerar
          </Button>
        </div>
      </div>
    </div>
  )
}

/**
 * Whether this repository already has a generated document of this type.
 *
 * Read off the generations the caller already loaded, so it costs no request.
 * It answers the question the reader actually has — "do I already have this?" —
 * which the old checkbox list could not.
 */
function hasGeneratedType(docs: DocGenerationSummary[], type: DocType): boolean {
  return docs.some((doc) => doc.types?.includes(type))
}

function ExistingBadge({ hasDoc }: { hasDoc: boolean }) {
  return (
    <span
      style={{
        fontSize: 10.5,
        fontWeight: 600,
        letterSpacing: '0.02em',
        color: hasDoc ? T.ink3 : T.accent700,
        background: hasDoc ? T.surfaceAlt : T.accentBg,
        borderRadius: T.radius.tag,
        padding: '2px 6px',
        whiteSpace: 'nowrap',
      }}
    >
      {hasDoc ? 'Substitui o atual' : 'Faltando'}
    </span>
  )
}
