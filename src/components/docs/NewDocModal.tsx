'use client'

import { CSSProperties, useEffect, useState } from 'react'
import { T } from '@/lib/tokens'
import { apiFetch } from '@/lib/api/client'
import {
  DocGenerationSummary,
  DocTemplate,
  DocTemplateScope,
} from '@/lib/types/docs'
import { MFIcon } from '@/components/icons/MFIcon'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { DocTemplateCard, DocTemplateDetail } from '@/components/docs/DocTemplateCard'
import { DocMarkdownEditor } from '@/components/docs/DocMarkdownEditor'

interface NewDocModalProps {
  isOpen: boolean
  onClose: () => void
  /**
   * Which scope this document belongs to. Repo scope needs the repository id;
   * org scope has none, which is the whole difference between the two.
   */
  scope: DocTemplateScope
  repoId?: string
  onCreated: (doc: DocGenerationSummary) => void
}

/**
 * Write a document by hand.
 *
 * This is the action that was missing: documentation could only be produced by
 * asking Claude, which made the AI path the default by being the only path. It
 * needs no Anthropic key, no host credential, no token budget and no job queue
 * — so unlike generation, it cannot fail for reasons unrelated to the document.
 *
 * One type at a time, deliberately. Batching exists in the generation flow only
 * to spend a single pull request on several files; a person writes one document.
 */
export function NewDocModal({ isOpen, onClose, scope, repoId, onCreated }: NewDocModalProps) {
  const [templates, setTemplates] = useState<DocTemplate[]>([])
  // Tracked by template id, not type: type is not unique across the registry
  // (the four org ADR templates share `type: 'adr'`), so selecting by it would
  // match more than one entry.
  const [templateID, setTemplateID] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    apiFetch<DocTemplate[]>(`/api/docs/templates?scope=${scope}`)
      .then((response) => {
        // Filtered again: the endpoint answers with everything when it does not
        // recognize the scope parameter, which is what an older server does.
        if (!cancelled) setTemplates(response.filter((t) => t.scope === scope))
      })
      .catch(() => {
        if (!cancelled) setError('Não foi possível carregar os tipos de documentação.')
      })
    return () => {
      cancelled = true
    }
  }, [isOpen, scope])

  useEffect(() => {
    if (!isOpen) {
      setTemplateID(null)
      setError(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const selected = templates.find((t) => t.id === templateID) ?? null

  async function handleSave(content: string) {
    if (!selected) return
    setError(null)
    setSaving(true)
    try {
      const endpoint =
        scope === 'repo'
          ? `/api/repositories/${repoId}/docs/manual`
          : '/api/organizations/docs/manual'
      const created = await apiFetch<DocGenerationSummary>(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: selected.type, content }),
      })
      onCreated(created)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar o documento.')
    } finally {
      setSaving(false)
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
    width: selected ? 'min(900px, 94vw)' : 560,
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
      aria-label="Nova documentação"
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
          <MFIcon name="doc" size={14} color={T.accent} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>
            {selected ? `Nova documentação · ${selected.label}` : 'Nova documentação'}
          </span>
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

          {!selected ? (
            <>
              <p style={{ fontSize: 12.5, color: T.ink3, margin: '0 0 14px', lineHeight: 1.5 }}>
                Escolha o tipo de documento que você vai escrever.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {templates.map((template) => (
                  <DocTemplateCard
                    key={template.id}
                    template={template}
                    selected={false}
                    onSelect={() => setTemplateID(template.id)}
                  >
                    <DocTemplateDetail template={template} />
                  </DocTemplateCard>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* The structure stays visible while writing: it is the outline
                  the reader was promised, and having it here beats having to
                  remember it from the previous screen. */}
              <div
                style={{
                  fontSize: 12,
                  color: T.ink3,
                  marginBottom: 12,
                  paddingBottom: 12,
                  borderBottom: `1px solid ${T.border}`,
                  lineHeight: 1.5,
                }}
              >
                <button
                  type="button"
                  onClick={() => setTemplateID(null)}
                  style={{
                    font: 'inherit',
                    background: 'none',
                    border: 0,
                    padding: 0,
                    cursor: 'pointer',
                    color: T.accent700,
                    marginRight: 8,
                  }}
                >
                  ← Trocar tipo
                </button>
                {selected.sections.join(' · ')}
              </div>
              <DocMarkdownEditor
                initialContent={sectionSkeleton(selected)}
                saving={saving}
                onSave={handleSave}
                onCancel={onClose}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * A starting outline built from the template's own sections.
 *
 * Not a sample document — those would drift from the prompts they mirror with
 * nothing to catch it. Headings are exactly what the type promises, which makes
 * the blank page answerable without inventing content nobody can verify.
 */
function sectionSkeleton(template: DocTemplate): string {
  const heading = `# ${template.label}\n`
  if (template.sections.length === 0) return heading
  return [heading, ...template.sections.map((section) => `## ${section}\n\n`)].join('\n')
}
