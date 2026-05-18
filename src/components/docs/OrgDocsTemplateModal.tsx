'use client'

import { CSSProperties, FormEvent, useEffect, useState } from 'react'
import { T } from '@/lib/tokens'
import { apiFetch } from '@/lib/api/client'
import {
  DocGenerationAcceptedResponse,
  DocTemplate,
  GenerateOrgDocsRequest,
} from '@/lib/types/docs'
import { MFIcon } from '@/components/icons/MFIcon'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'

interface OrgDocsTemplateModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (response: DocGenerationAcceptedResponse) => void
}

/**
 * Two-column gallery modal: list of templates on the left, preview of the
 * selected template on the right (sections + optional user-prompt textarea
 * for ADR-style docs). Templates are fetched on first open and cached for
 * the modal lifetime — they rarely change.
 */
export function OrgDocsTemplateModal({ isOpen, onClose, onSuccess }: OrgDocsTemplateModalProps) {
  const [templates, setTemplates] = useState<DocTemplate[]>([])
  const [selectedID, setSelectedID] = useState<string | null>(null)
  const [userPrompt, setUserPrompt] = useState('')
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || templates.length > 0) return
    setLoadingTemplates(true)
    setError(null)
    apiFetch<DocTemplate[]>('/api/docs/templates', { method: 'GET' })
      .then((items) => {
        setTemplates(items)
        if (items.length > 0) setSelectedID(items[0].id)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar templates'))
      .finally(() => setLoadingTemplates(false))
  }, [isOpen, templates.length])

  if (!isOpen) return null

  const selectedTemplate = templates.find((t) => t.id === selectedID) ?? null

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!selectedTemplate) return
    setError(null)

    // ADR templates need a user-typed topic to give Claude a starting point.
    // Architecture and Guidelines run off the org context alone.
    const needsPrompt = selectedTemplate.type === 'adr'
    if (needsPrompt && !userPrompt.trim()) {
      setError('Descreva sobre o que é essa ADR.')
      return
    }

    setSubmitting(true)
    try {
      const body: GenerateOrgDocsRequest = {
        types: [selectedTemplate.type],
      }
      if (selectedTemplate.type === 'adr') {
        body.template_id = selectedTemplate.id
        body.prompt = userPrompt.trim()
      }
      const response = await apiFetch<DocGenerationAcceptedResponse>('/api/organizations/docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      onSuccess(response)
      onClose()
      setUserPrompt('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar documentação')
    } finally {
      setSubmitting(false)
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
    width: 'min(720px, 96vw)',
    maxHeight: '90vh',
    background: T.surfaceOverlay,
    border: `1px solid ${T.borderStrong}`,
    borderRadius: 12,
    boxShadow: T.shadow,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  }

  const headerStyle: CSSProperties = {
    padding: '14px 16px',
    borderBottom: `1px solid ${T.border}`,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  }

  const bodyStyle: CSSProperties = {
    flex: 1,
    minHeight: 0,
    display: 'grid',
    gridTemplateColumns: '280px 1fr',
  }

  const listStyle: CSSProperties = {
    borderRight: `1px solid ${T.border}`,
    overflow: 'auto',
    padding: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  }

  const cardStyle = (active: boolean): CSSProperties => ({
    appearance: 'none',
    border: `1px solid ${active ? T.accent : T.border}`,
    borderRadius: 8,
    padding: 10,
    background: active ? T.accentBg : T.surface,
    color: T.ink,
    textAlign: 'left',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  })

  const previewStyle: CSSProperties = {
    padding: 16,
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  }

  const sectionListStyle: CSSProperties = {
    listStyle: 'disc',
    paddingLeft: 18,
    margin: 0,
    fontSize: 12.5,
    color: T.ink2,
    lineHeight: 1.6,
  }

  const textareaStyle: CSSProperties = {
    width: '100%',
    minHeight: 100,
    padding: '8px 10px',
    border: `1px solid ${T.border}`,
    borderRadius: 6,
    background: T.surface,
    color: T.ink,
    fontFamily: T.font,
    fontSize: 13,
    resize: 'vertical',
  }

  const footerStyle: CSSProperties = {
    padding: '12px 16px',
    borderTop: `1px solid ${T.border}`,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'flex-end',
  }

  return (
    <div style={overlayStyle} onClick={onClose} role="dialog" aria-modal="true" aria-label="Gerar documentação org">
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <MFIcon name="sparkles" size={14} color={T.ai} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>Gerar documentação organizacional</span>
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

        <div style={bodyStyle}>
          <div style={listStyle}>
            {loadingTemplates && (
              <div style={{ padding: 12, color: T.faint, fontSize: 12.5 }}>Carregando…</div>
            )}
            {!loadingTemplates &&
              templates.map((tmpl) => (
                <button
                  key={tmpl.id}
                  type="button"
                  style={cardStyle(tmpl.id === selectedID)}
                  onClick={() => setSelectedID(tmpl.id)}
                >
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{tmpl.label}</span>
                  <span style={{ fontSize: 11, color: T.ink3, lineHeight: 1.45 }}>{tmpl.description}</span>
                  <span
                    style={{
                      fontSize: 10.5,
                      color: T.faint,
                      fontFamily: T.mono,
                      marginTop: 2,
                    }}
                  >
                    {tmpl.type}
                  </span>
                </button>
              ))}
          </div>

          <form style={previewStyle} onSubmit={handleSubmit}>
            {error && <Alert variant="danger">{error}</Alert>}
            {!selectedTemplate ? (
              <div style={{ color: T.faint, fontSize: 13 }}>Selecione um template à esquerda.</div>
            ) : (
              <>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                    {selectedTemplate.label}
                  </div>
                  <div style={{ fontSize: 12.5, color: T.ink3, lineHeight: 1.55 }}>
                    {selectedTemplate.description}
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: 10.5,
                      fontWeight: 600,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: T.faint,
                      marginBottom: 6,
                    }}
                  >
                    Estrutura
                  </div>
                  <ul style={sectionListStyle}>
                    {selectedTemplate.sections.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>

                {selectedTemplate.type === 'adr' && (
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 12, color: T.ink2, fontWeight: 500 }}>
                      Sobre o que é essa ADR? *
                    </span>
                    <textarea
                      style={textareaStyle}
                      value={userPrompt}
                      onChange={(e) => setUserPrompt(e.target.value)}
                      placeholder="Ex.: padrão de retry exponencial para chamadas entre serviços."
                      required
                    />
                  </label>
                )}
              </>
            )}
          </form>
        </div>

        <div style={footerStyle}>
          <Button variant="default" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={submitting} disabled={!selectedTemplate}>
            Gerar
          </Button>
        </div>
      </div>
    </div>
  )
}
