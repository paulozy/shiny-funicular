'use client'

import { CSSProperties, FormEvent, useState } from 'react'
import { T } from '@/lib/tokens'
import { apiFetch } from '@/lib/api/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { MFIcon } from '@/components/icons/MFIcon'
import { CoverageTokenWithSecret, CreateCoverageTokenRequest } from '@/lib/types/coverage'

interface NewCoverageTokenModalProps {
  isOpen: boolean
  repoID: string
  onClose: () => void
  onCreated: (token: CoverageTokenWithSecret) => void
}

export function NewCoverageTokenModal({
  isOpen,
  repoID,
  onClose,
  onCreated,
}: NewCoverageTokenModalProps) {
  const [name, setName] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const reset = () => {
    setName('')
    setExpiresAt('')
    setError(null)
  }

  const handleClose = () => {
    if (loading) return
    reset()
    onClose()
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!name.trim()) {
      setError('Informe um nome para identificar este token.')
      return
    }
    setLoading(true)
    try {
      const body: CreateCoverageTokenRequest = {
        name: name.trim(),
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      }
      const created = await apiFetch<CoverageTokenWithSecret>(
        `/api/repositories/${repoID}/coverage/tokens`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      )
      reset()
      onCreated(created)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar o token.')
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
    width: 460,
    maxHeight: '90vh',
    background: T.surface,
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
  const contentStyle: CSSProperties = { padding: '20px', overflow: 'auto', flex: 1 }
  const formStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 12 }
  const footerStyle: CSSProperties = {
    padding: '12px 16px',
    borderTop: `1px solid ${T.border}`,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'flex-end',
  }

  return (
    <div style={overlayStyle} onClick={handleClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <MFIcon name="plus" size={14} />
          <span style={titleStyle}>Novo token de upload de cobertura</span>
          <button
            onClick={handleClose}
            disabled={loading}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              color: T.faint,
              fontSize: 20,
              padding: 0,
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        <div style={contentStyle}>
          {error && <Alert variant="danger">{error}</Alert>}
          <form style={formStyle} onSubmit={handleSubmit}>
            <Input
              label="Nome *"
              placeholder="ex.: github-actions"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
            />
            <Input
              label="Expira em (opcional)"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
            <p style={{ fontSize: 12, color: T.ink2, margin: 0 }}>
              O CI usará este token para enviar relatórios de cobertura via{' '}
              <code style={{ fontFamily: T.mono, fontSize: 12 }}>POST /coverage</code>.
              Tokens são exibidos uma única vez.
            </p>
          </form>
        </div>

        <div style={footerStyle}>
          <Button variant="default" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            Gerar token
          </Button>
        </div>
      </div>
    </div>
  )
}
