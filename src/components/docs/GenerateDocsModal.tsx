'use client'

import { CSSProperties, FormEvent, useState } from 'react'
import { T } from '@/lib/tokens'
import { apiFetch } from '@/lib/api/client'
import {
  DOC_TYPES,
  DOC_TYPE_LABELS,
  DocGenerationAcceptedResponse,
  DocType,
  GenerateDocsRequest,
} from '@/lib/types/docs'
import { MFIcon } from '@/components/icons/MFIcon'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'

interface GenerateDocsModalProps {
  isOpen: boolean
  onClose: () => void
  repoId: string
  defaultBranch?: string
  onSuccess: (response: DocGenerationAcceptedResponse) => void
}

export function GenerateDocsModal({
  isOpen,
  onClose,
  repoId,
  defaultBranch,
  onSuccess,
}: GenerateDocsModalProps) {
  const [selected, setSelected] = useState<Set<DocType>>(new Set(DOC_TYPES))
  const [branch, setBranch] = useState(defaultBranch ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const toggle = (type: DocType) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
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
        types: Array.from(selected),
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
    width: 480,
    maxHeight: '90vh',
    background: T.surfaceOverlay,
    border: `1px solid ${T.borderStrong}`,
    borderRadius: 12,
    boxShadow: T.shadow,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  }

  const checkboxRowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 0',
    fontSize: 13,
    cursor: 'pointer',
  }

  return (
    <div style={overlayStyle} onClick={onClose} role="dialog" aria-modal="true" aria-label="Gerar documentação">
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
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <span style={{ fontSize: 12, color: T.ink2, fontWeight: 500 }}>Tipos *</span>
              {DOC_TYPES.map((type) => (
                <label key={type} style={checkboxRowStyle}>
                  <input
                    type="checkbox"
                    checked={selected.has(type)}
                    onChange={() => toggle(type)}
                    style={{ width: 16, height: 16, cursor: 'pointer', accentColor: T.accent }}
                  />
                  <span>{DOC_TYPE_LABELS[type]}</span>
                  <span style={{ fontSize: 11, color: T.faint, fontFamily: T.mono }}>{type}</span>
                </label>
              ))}
            </div>
            <Input
              label="Branch (opcional)"
              placeholder="main"
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
