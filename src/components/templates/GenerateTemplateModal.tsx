'use client'

import { CSSProperties, FormEvent, useState } from 'react'
import { T } from '@/lib/tokens'
import { apiFetch } from '@/lib/api/client'
import { GenerateTemplateRequest, TemplateAcceptedResponse } from '@/lib/types/template'
import { MFIcon } from '@/components/icons/MFIcon'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'

interface GenerateTemplateModalProps {
  isOpen: boolean
  onClose: () => void
  /** When provided, generation is scoped to a repository (POST /repositories/:id/templates). */
  repoId?: string
  /** Pre-fills the stack hint input (handy when launching from a repo page). */
  initialStackHint?: string
  onSuccess: (response: TemplateAcceptedResponse) => void
}

export function GenerateTemplateModal({
  isOpen,
  onClose,
  repoId,
  initialStackHint,
  onSuccess,
}: GenerateTemplateModalProps) {
  const [prompt, setPrompt] = useState('')
  const [stackHint, setStackHint] = useState(initialStackHint ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!prompt.trim()) {
      setError('Descreva o que você quer gerar.')
      return
    }
    setLoading(true)
    try {
      const body: GenerateTemplateRequest = { prompt: prompt.trim() }
      if (stackHint.trim()) body.stack_hint = stackHint.trim()
      const path = repoId ? `/api/repositories/${repoId}/templates` : '/api/templates'
      const response = await apiFetch<TemplateAcceptedResponse>(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      onSuccess(response)
      setPrompt('')
      setStackHint('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar template')
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
    width: 520,
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

  const titleStyle: CSSProperties = { fontSize: 14, fontWeight: 600 }
  const contentStyle: CSSProperties = { padding: 20, overflow: 'auto', flex: 1 }
  const formStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 12 }
  const textareaStyle: CSSProperties = {
    width: '100%',
    minHeight: 120,
    padding: '8px 10px',
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.input,
    background: T.surface,
    color: T.ink,
    fontFamily: T.font,
    fontSize: 13,
    resize: 'vertical',
  }
  const labelStyle: CSSProperties = { fontSize: 12, color: T.ink2, fontWeight: 500 }
  const footerStyle: CSSProperties = {
    padding: '12px 16px',
    borderTop: `1px solid ${T.border}`,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'flex-end',
  }

  return (
    <div style={overlayStyle} onClick={onClose} role="dialog" aria-modal="true" aria-label="Gerar template">
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <MFIcon name="sparkles" size={14} color={T.ai} />
          <span style={titleStyle}>Gerar template{repoId ? ' para este repositório' : ''}</span>
          <button
            onClick={onClose}
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
            aria-label="Fechar modal"
          >
            ✕
          </button>
        </div>

        <div style={contentStyle}>
          {error && <Alert variant="danger">{error}</Alert>}
          <form style={formStyle} onSubmit={handleSubmit}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={labelStyle}>O que gerar? *</span>
              <textarea
                style={textareaStyle}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex.: API REST em Node + Express com auth JWT, testes Jest e Dockerfile."
                required
              />
            </label>
            <Input
              label="Stack hint (opcional)"
              placeholder="next.js, postgres, prisma"
              value={stackHint}
              onChange={(e) => setStackHint(e.target.value)}
            />
          </form>
        </div>

        <div style={footerStyle}>
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
