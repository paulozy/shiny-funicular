'use client'

import { CSSProperties, useState } from 'react'
import { T } from '@/lib/tokens'
import { apiFetch } from '@/lib/api/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { UserRole } from '@/lib/types/auth'
import { CreateInviteResult } from '@/lib/types/organization-members'

interface NewInviteModalProps {
  isOpen: boolean
  onClose: () => void
  /** Receives the secret-bearing response; this component never displays it. */
  onCreated: (result: CreateInviteResult) => void
}

const ROLE_OPTIONS: Array<{ value: UserRole; label: string; hint: string }> = [
  { value: 'viewer', label: 'Viewer', hint: 'só leitura' },
  { value: 'developer', label: 'Developer', hint: 'cria repos, gera docs' },
  { value: 'maintainer', label: 'Maintainer', hint: 'edita e remove repos' },
  { value: 'admin', label: 'Admin', hint: 'configura a organização e convida' },
]

export function NewInviteModal({ isOpen, onClose, onCreated }: NewInviteModalProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserRole>('developer')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleClose = () => {
    if (loading) return
    setEmail('')
    setRole('developer')
    setError(null)
    onClose()
  }

  const handleSubmit = async () => {
    setError(null)
    setLoading(true)
    try {
      const created = await apiFetch<CreateInviteResult>('/api/organizations/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), role }),
      })
      setEmail('')
      setRole('developer')
      onCreated(created)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar o convite.')
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
    zIndex: 50,
  }

  const cardStyle: CSSProperties = {
    width: 460,
    maxWidth: '92vw',
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.card,
    display: 'flex',
    flexDirection: 'column',
  }

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
    borderBottom: `1px solid ${T.border}`,
  }

  const bodyStyle: CSSProperties = { padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }

  const footerStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
    padding: '12px 16px',
    borderTop: `1px solid ${T.border}`,
  }

  return (
    <div style={overlayStyle} onClick={handleClose} role="presentation">
      <div
        style={cardStyle}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Convidar pessoa para a organização"
      >
        <div style={headerStyle}>
          <strong style={{ fontSize: 14 }}>Convidar para a organização</strong>
          <button
            type="button"
            aria-label="Fechar"
            onClick={handleClose}
            style={{ appearance: 'none', border: 0, background: 'transparent', cursor: 'pointer', color: T.ink3 }}
          >
            ✕
          </button>
        </div>

        <div style={bodyStyle}>
          <Input
            label="E-mail"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="pessoa@empresa.com"
            hint="O convite só pode ser aceito por este e-mail."
          />

          <div>
            <label htmlFor="invite-role" style={{ display: 'block', fontSize: 12.5, fontWeight: 500, marginBottom: 6 }}>
              Papel
            </label>
            <select
              id="invite-role"
              value={role}
              onChange={(event) => setRole(event.target.value as UserRole)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: T.radius.button,
                border: `1px solid ${T.border}`,
                background: T.surface,
                color: T.ink,
                fontSize: 13,
              }}
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} — {option.hint}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div role="alert" style={{ fontSize: 12.5, color: T.danger }}>
              {error}
            </div>
          )}
        </div>

        <div style={footerStyle}>
          <Button variant="default" size="md" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="md"
            loading={loading}
            disabled={loading || !email.trim()}
            onClick={handleSubmit}
          >
            Gerar convite
          </Button>
        </div>
      </div>
    </div>
  )
}
