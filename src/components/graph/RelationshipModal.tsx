'use client'

import { CSSProperties, FormEvent, useEffect, useState } from 'react'
import { T } from '@/lib/tokens'
import { apiFetch } from '@/lib/api/client'
import {
  CreateRepositoryRelationshipRequest,
  RELATIONSHIP_KINDS,
  RELATIONSHIP_KIND_LABELS,
  RelationshipKind,
  RepositoryGraphEdge,
  RepositoryGraphNode,
  UpdateRepositoryRelationshipRequest,
} from '@/lib/types/graph'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'

interface RelationshipModalProps {
  isOpen: boolean
  onClose: () => void
  nodes: RepositoryGraphNode[]
  /** When provided, the modal is in edit mode. Otherwise it creates a new relationship. */
  initialEdge?: RepositoryGraphEdge | null
  /** Pre-fills the source repo (useful when opened from a node's drawer). */
  initialSourceId?: string | null
  onSuccess: (edge: RepositoryGraphEdge) => void
}

const selectStyle: CSSProperties = {
  appearance: 'none',
  width: '100%',
  border: `1px solid var(--color-border)`,
  borderRadius: 6,
  padding: '8px 10px',
  fontSize: 13,
  background: 'var(--color-surface)',
  color: 'var(--color-ink)',
}

export function RelationshipModal({
  isOpen,
  onClose,
  nodes,
  initialEdge,
  initialSourceId,
  onSuccess,
}: RelationshipModalProps) {
  const isEdit = Boolean(initialEdge)
  const [sourceId, setSourceId] = useState('')
  const [targetId, setTargetId] = useState('')
  const [kind, setKind] = useState<RelationshipKind>('http')
  const [label, setLabel] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    if (initialEdge) {
      setSourceId(initialEdge.source_repository_id)
      setTargetId(initialEdge.target_repository_id)
      setKind(initialEdge.kind)
      setLabel(initialEdge.label ?? '')
      setDescription(initialEdge.description ?? '')
    } else {
      setSourceId(initialSourceId ?? '')
      setTargetId('')
      setKind('http')
      setLabel('')
      setDescription('')
    }
    setError(null)
  }, [isOpen, initialEdge, initialSourceId])

  if (!isOpen) return null

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!sourceId || !targetId) {
      setError('Selecione origem e destino.')
      return
    }
    if (sourceId === targetId) {
      setError('Origem e destino não podem ser o mesmo repositório.')
      return
    }
    setLoading(true)
    try {
      let result: RepositoryGraphEdge
      if (isEdit && initialEdge) {
        const body: UpdateRepositoryRelationshipRequest = {
          kind,
          label: label || undefined,
          description: description || undefined,
        }
        result = await apiFetch<RepositoryGraphEdge>(
          `/api/repository-relationships/${initialEdge.id}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          }
        )
      } else {
        const body: CreateRepositoryRelationshipRequest = {
          source_repository_id: sourceId,
          target_repository_id: targetId,
          kind,
          label: label || undefined,
          description: description || undefined,
        }
        result = await apiFetch<RepositoryGraphEdge>('/api/repository-relationships', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      }
      onSuccess(result)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar relação')
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
    background: T.surfaceOverlay,
    border: `1px solid ${T.borderStrong}`,
    borderRadius: 12,
    boxShadow: T.shadow,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  }

  return (
    <div style={overlayStyle} onClick={onClose} role="dialog" aria-modal="true" aria-label={isEdit ? 'Editar relação' : 'Nova relação'}>
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
          <span style={{ fontSize: 14, fontWeight: 600 }}>
            {isEdit ? 'Editar relação' : 'Nova relação'}
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
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label>
              <span style={{ fontSize: 12, color: T.ink2, fontWeight: 500 }}>Origem *</span>
              <select
                style={selectStyle}
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                disabled={isEdit}
              >
                <option value="" disabled>
                  Selecione um repositório
                </option>
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span style={{ fontSize: 12, color: T.ink2, fontWeight: 500 }}>Destino *</span>
              <select
                style={selectStyle}
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                disabled={isEdit}
              >
                <option value="" disabled>
                  Selecione um repositório
                </option>
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span style={{ fontSize: 12, color: T.ink2, fontWeight: 500 }}>Tipo *</span>
              <select
                style={selectStyle}
                value={kind}
                onChange={(e) => setKind(e.target.value as RelationshipKind)}
              >
                {RELATIONSHIP_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {RELATIONSHIP_KIND_LABELS[k]}
                  </option>
                ))}
              </select>
            </label>
            <Input
              label="Rótulo (opcional)"
              placeholder="ex.: GET /users"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
            <Input
              label="Descrição (opcional)"
              placeholder="Como esses serviços se conectam"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
            {isEdit ? 'Salvar' : 'Criar'}
          </Button>
        </div>
      </div>
    </div>
  )
}
