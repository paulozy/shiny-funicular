'use client'

import { CSSProperties, FormEvent, useState } from 'react'
import { RepositoryResponse, CreateRepositoryRequest } from '@/lib/types/repository'
import { T } from '@/lib/tokens'
import { apiFetch } from '@/lib/api/client'
import { MFIcon } from '@/components/icons/MFIcon'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'

interface NewRepoModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (repo: RepositoryResponse) => void
}

export function NewRepoModal({ isOpen, onClose, onSuccess }: NewRepoModalProps) {
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const body: CreateRepositoryRequest = {
        url,
        description: description || undefined,
        is_private: isPrivate,
      }

      const repo = await apiFetch<RepositoryResponse>('/api/repositories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      onSuccess(repo)
      setUrl('')
      setDescription('')
      setIsPrivate(false)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar repositório')
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
    width: 420,
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

  const titleStyle: CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
  }

  const contentStyle: CSSProperties = {
    padding: '20px',
    overflow: 'auto',
    flex: 1,
  }

  const formStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  }

  const checkboxStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 0',
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
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <MFIcon name="plus" size={14} />
          <span style={titleStyle}>Novo Repositório</span>
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
          >
            ✕
          </button>
        </div>

        <div style={contentStyle}>
          {error && <Alert variant="danger">{error}</Alert>}

          <form style={formStyle} onSubmit={handleSubmit}>
            <Input
              label="URL do Repositório *"
              placeholder="https://github.com/username/repo"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />

            <Input
              label="Descrição"
              placeholder="Breve descrição do repositório"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <div style={checkboxStyle}>
              <input
                type="checkbox"
                id="isPrivate"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                style={{
                  width: 16,
                  height: 16,
                  cursor: 'pointer',
                  accentColor: T.accent,
                }}
              />
              <label htmlFor="isPrivate" style={{ cursor: 'pointer', fontSize: 13 }}>
                Privado
              </label>
            </div>
          </form>
        </div>

        <div style={footerStyle}>
          <Button variant="default" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            Criar
          </Button>
        </div>
      </div>
    </div>
  )
}
