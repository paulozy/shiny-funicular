'use client'

import { CSSProperties } from 'react'
import Link from 'next/link'
import { T } from '@/lib/tokens'
import {
  RELATIONSHIP_KIND_LABELS,
  RepositoryGraphEdge,
  RepositoryGraphNode,
} from '@/lib/types/graph'
import { MFIcon } from '@/components/icons/MFIcon'

interface RelationshipDrawerProps {
  selectedNode: RepositoryGraphNode | null
  selectedEdge: RepositoryGraphEdge | null
  nodes: RepositoryGraphNode[]
  edges: RepositoryGraphEdge[]
  onCreateRelationship: () => void
  onEditRelationship: (edge: RepositoryGraphEdge) => void
  onDeleteRelationship: (edge: RepositoryGraphEdge) => void
  onClose: () => void
}

export function RelationshipDrawer({
  selectedNode,
  selectedEdge,
  nodes,
  edges,
  onCreateRelationship,
  onEditRelationship,
  onDeleteRelationship,
  onClose,
}: RelationshipDrawerProps) {
  if (!selectedNode && !selectedEdge) return null

  const containerStyle: CSSProperties = {
    width: 320,
    borderLeft: `1px solid ${T.border}`,
    background: T.surface,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    flexShrink: 0,
  }

  const headerStyle: CSSProperties = {
    padding: '12px 16px',
    borderBottom: `1px solid ${T.border}`,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  }

  const bodyStyle: CSSProperties = {
    padding: 16,
    overflow: 'auto',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  }

  const sectionTitleStyle: CSSProperties = {
    fontSize: 10.5,
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: T.faint,
  }

  const closeButtonStyle: CSSProperties = {
    marginLeft: 'auto',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: T.faint,
    fontSize: 18,
    padding: 0,
    lineHeight: 1,
  }

  // Edge selected view
  if (selectedEdge) {
    const source = nodes.find((n) => n.id === selectedEdge.source_repository_id)
    const target = nodes.find((n) => n.id === selectedEdge.target_repository_id)
    return (
      <aside style={containerStyle} aria-label="Detalhes da relação">
        <div style={headerStyle}>
          <MFIcon name="graph" size={14} color={T.ai} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>Relação</span>
          <button onClick={onClose} aria-label="Fechar painel" style={closeButtonStyle}>
            ✕
          </button>
        </div>
        <div style={bodyStyle}>
          <div>
            <div style={sectionTitleStyle}>Tipo</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>
              {RELATIONSHIP_KIND_LABELS[selectedEdge.kind]}{' '}
              <span style={{ color: T.faint, fontSize: 11.5 }}>· confiança {selectedEdge.confidence.toFixed(2)}</span>
            </div>
          </div>
          <div>
            <div style={sectionTitleStyle}>Origem → Destino</div>
            <div style={{ fontSize: 13, marginTop: 4, fontFamily: T.mono }}>
              {source?.name ?? selectedEdge.source_repository_id}
              <span style={{ color: T.faint }}> → </span>
              {target?.name ?? selectedEdge.target_repository_id}
            </div>
          </div>
          {selectedEdge.description && (
            <div>
              <div style={sectionTitleStyle}>Descrição</div>
              <div style={{ fontSize: 13, marginTop: 4, color: T.ink2 }}>{selectedEdge.description}</div>
            </div>
          )}
          <div>
            <div style={sectionTitleStyle}>Fonte</div>
            <div style={{ fontSize: 12, marginTop: 4, color: T.ink3, fontFamily: T.mono }}>
              {selectedEdge.source}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
            <button
              type="button"
              onClick={() => onEditRelationship(selectedEdge)}
              style={{
                flex: 1,
                appearance: 'none',
                border: `1px solid ${T.border}`,
                borderRadius: T.radius.button,
                background: T.surface,
                color: T.ink,
                padding: '8px 10px',
                fontSize: 12.5,
                cursor: 'pointer',
              }}
            >
              Editar
            </button>
            <button
              type="button"
              onClick={() => onDeleteRelationship(selectedEdge)}
              style={{
                flex: 1,
                appearance: 'none',
                border: `1px solid ${T.dangerBorder}`,
                borderRadius: T.radius.button,
                background: T.dangerBg,
                color: T.danger,
                padding: '8px 10px',
                fontSize: 12.5,
                cursor: 'pointer',
              }}
            >
              Remover
            </button>
          </div>
        </div>
      </aside>
    )
  }

  // Node selected view
  if (selectedNode) {
    const incoming = edges.filter((e) => e.target_repository_id === selectedNode.id)
    const outgoing = edges.filter((e) => e.source_repository_id === selectedNode.id)
    return (
      <aside style={containerStyle} aria-label="Detalhes do repositório">
        <div style={headerStyle}>
          <MFIcon name="branch" size={14} color={T.accent} />
          <span style={{ fontSize: 13, fontWeight: 600, fontFamily: T.mono }}>{selectedNode.name}</span>
          <button onClick={onClose} aria-label="Fechar painel" style={closeButtonStyle}>
            ✕
          </button>
        </div>
        <div style={bodyStyle}>
          {selectedNode.description && (
            <div style={{ fontSize: 12.5, color: T.ink3 }}>{selectedNode.description}</div>
          )}
          <Link
            href={`/code/repositories/${selectedNode.id}`}
            style={{
              fontSize: 12.5,
              color: T.accent,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            Abrir repositório <MFIcon name="arrow-right" size={11} color="currentColor" />
          </Link>

          <div>
            <div style={sectionTitleStyle}>Saídas ({outgoing.length})</div>
            {outgoing.length === 0 ? (
              <div style={{ fontSize: 12, color: T.faint, marginTop: 4 }}>Nenhuma</div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: '4px 0 0', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {outgoing.map((e) => (
                  <li key={e.id} style={{ fontSize: 12, color: T.ink2, fontFamily: T.mono }}>
                    {RELATIONSHIP_KIND_LABELS[e.kind]}{' → '}
                    {nodes.find((n) => n.id === e.target_repository_id)?.name ?? e.target_repository_id}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <div style={sectionTitleStyle}>Entradas ({incoming.length})</div>
            {incoming.length === 0 ? (
              <div style={{ fontSize: 12, color: T.faint, marginTop: 4 }}>Nenhuma</div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: '4px 0 0', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {incoming.map((e) => (
                  <li key={e.id} style={{ fontSize: 12, color: T.ink2, fontFamily: T.mono }}>
                    {nodes.find((n) => n.id === e.source_repository_id)?.name ?? e.source_repository_id}
                    {' → '}
                    {RELATIONSHIP_KIND_LABELS[e.kind]}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            type="button"
            onClick={onCreateRelationship}
            style={{
              marginTop: 'auto',
              appearance: 'none',
              border: 0,
              borderRadius: T.radius.button,
              background: T.accent,
              color: T.inkInverse,
              padding: '8px 12px',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            + Nova relação a partir daqui
          </button>
        </div>
      </aside>
    )
  }

  return null
}
