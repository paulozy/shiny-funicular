'use client'

import { CSSProperties } from 'react'
import Link from 'next/link'
import { T } from '@/lib/tokens'
import {
  RELATIONSHIP_KIND_LABELS,
  RELATIONSHIP_SOURCE_LABELS,
  RepositoryGraphEdge,
  RepositoryGraphNode,
  isDeclaredEdge,
  nodeUUID,
} from '@/lib/types/graph'
import { MFIcon } from '@/components/icons/MFIcon'

const NODE_PANEL_LABELS: Record<RepositoryGraphNode['kind'], string> = {
  repo: 'Detalhes do repositório',
  api: 'Detalhes da API',
  resource: 'Detalhes do recurso',
}

const NODE_ICONS: Record<RepositoryGraphNode['kind'], 'branch' | 'graph' | 'database'> = {
  repo: 'branch',
  api: 'graph',
  resource: 'database',
}

const SPEC_KIND_LABELS: Record<string, string> = {
  openapi: 'OpenAPI',
  asyncapi: 'AsyncAPI',
  graphql: 'GraphQL',
  grpc: 'gRPC',
}

interface RelationshipDrawerProps {
  selectedNode: RepositoryGraphNode | null
  selectedEdge: RepositoryGraphEdge | null
  nodes: RepositoryGraphNode[]
  edges: RepositoryGraphEdge[]
  /** Hides the mutating controls when the caller's role cannot manage edges. */
  canManage?: boolean
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
  canManage = false,
  onCreateRelationship,
  onEditRelationship,
  onDeleteRelationship,
  onClose,
}: RelationshipDrawerProps) {
  if (!selectedNode && !selectedEdge) return null

  // v3 places the details next to the canvas as a card in the page grid, not
  // as a panel glued to the viewport edge.
  const containerStyle: CSSProperties = {
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.card,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  }

  const headerStyle: CSSProperties = {
    padding: '14px 18px',
    borderBottom: `1px solid ${T.border}`,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  }

  const bodyStyle: CSSProperties = {
    padding: 18,
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
    const source = nodes.find((n) => n.id === selectedEdge.source)
    const target = nodes.find((n) => n.id === selectedEdge.target)
    const derived = !isDeclaredEdge(selectedEdge)
    const metadata = (selectedEdge.metadata ?? {}) as Record<string, unknown>
    const ruleId = typeof metadata.rule_id === 'string' ? metadata.rule_id : undefined
    const evidencePath =
      typeof metadata.evidence_path === 'string'
        ? metadata.evidence_path
        : typeof metadata.manifest_path === 'string'
          ? metadata.manifest_path
          : undefined
    const envVarName = typeof metadata.env_var_name === 'string' ? metadata.env_var_name : undefined
    const declaredVersion =
      typeof metadata.declared_version === 'string' ? metadata.declared_version : undefined
    return (
      <aside style={containerStyle} aria-label="Detalhes da relação">
        <div style={headerStyle}>
          <MFIcon name="graph" size={14} color={T.ai} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>Relação</span>
          {/* A derived edge must never look like a declaration. Not being able to
              tell an assertion from a guess is what makes people stop trusting a
              catalog — and a catalog nobody trusts costs maintenance and returns
              no decisions. */}
          <span
            aria-label={derived ? 'Aresta derivada' : 'Aresta declarada'}
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              padding: '2px 6px',
              borderRadius: 4,
              border: `1px solid ${derived ? T.border : T.accent}`,
              background: derived ? T.surfaceAlt : T.accentBg,
              color: derived ? T.faint : T.accent,
            }}
          >
            {derived ? 'derivada' : 'declarada'}
          </span>
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
              {source?.name ?? selectedEdge.source}
              <span style={{ color: T.faint }}> → </span>
              {target?.name ?? selectedEdge.target}
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
              {RELATIONSHIP_SOURCE_LABELS[selectedEdge.provenance] ?? selectedEdge.provenance}
            </div>
          </div>
          {/* The evidence is what lets a person judge the edge in two seconds. It
              matters most for the consumption edges: a repository that mocks B in
              its tests is statically indistinguishable from one that calls B, so
              seeing the exact file is the only available defence. */}
          {ruleId && (
            <div>
              <div style={sectionTitleStyle}>Regra</div>
              <div style={{ fontSize: 12, marginTop: 4, color: T.ink3, fontFamily: T.mono }}>{ruleId}</div>
            </div>
          )}
          {evidencePath && (
            <div>
              <div style={sectionTitleStyle}>Evidência</div>
              <div style={{ fontSize: 12, marginTop: 4, color: T.ink3, fontFamily: T.mono }}>
                {evidencePath}
                {envVarName && <span style={{ color: T.faint }}> · via {envVarName}</span>}
              </div>
            </div>
          )}
          {declaredVersion && (
            <div>
              <div style={sectionTitleStyle}>Versão declarada</div>
              <div style={{ fontSize: 12, marginTop: 4, color: T.ink3, fontFamily: T.mono }}>{declaredVersion}</div>
            </div>
          )}
          {canManage && (
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
          )}
        </div>
      </aside>
    )
  }

  // Node selected view
  if (selectedNode) {
    const incoming = edges.filter((e) => e.target === selectedNode.id)
    const outgoing = edges.filter((e) => e.source === selectedNode.id)
    // The approved scope is node plus drawer — there is no route of its own for an
    // API or a resource — so this panel is the entire detail surface for both.
    const ownerRepositoryID =
      selectedNode.kind === 'repo' ? nodeUUID(selectedNode.id) : selectedNode.repository_id
    return (
      <aside style={containerStyle} aria-label={NODE_PANEL_LABELS[selectedNode.kind]}>
        <div style={headerStyle}>
          <MFIcon name={NODE_ICONS[selectedNode.kind]} size={14} color={T.accent} />
          <span style={{ fontSize: 13, fontWeight: 600, fontFamily: T.mono }}>{selectedNode.name}</span>
          <button onClick={onClose} aria-label="Fechar painel" style={closeButtonStyle}>
            ✕
          </button>
        </div>
        <div style={bodyStyle}>
          {selectedNode.kind === 'repo' && selectedNode.description && (
            <div style={{ fontSize: 12.5, color: T.ink3 }}>{selectedNode.description}</div>
          )}

          {selectedNode.kind === 'api' && (
            <>
              <div>
                <div style={sectionTitleStyle}>Contrato</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>
                  {SPEC_KIND_LABELS[selectedNode.spec_kind] ?? selectedNode.spec_kind}
                  {selectedNode.version && (
                    <span style={{ color: T.faint, fontSize: 11.5 }}> · versão {selectedNode.version}</span>
                  )}
                </div>
              </div>
              <div>
                <div style={sectionTitleStyle}>Spec</div>
                <div style={{ fontSize: 12, marginTop: 4, color: T.ink3, fontFamily: T.mono }}>
                  {selectedNode.spec_path}
                </div>
              </div>
              <div>
                <div style={sectionTitleStyle}>Operações</div>
                {/* A dash, never a zero: the count is withdrawn when `$ref` made it
                    unreliable, and a confident zero for a service with thirty
                    operations looks measured. */}
                <div style={{ fontSize: 13, marginTop: 4 }}>
                  {selectedNode.operation_count ?? '—'}
                </div>
              </div>
            </>
          )}

          {selectedNode.kind === 'resource' && (
            <>
              <div>
                <div style={sectionTitleStyle}>Engine</div>
                <div style={{ fontSize: 13, marginTop: 4, fontFamily: T.mono }}>{selectedNode.engine}</div>
              </div>
              <div>
                <div style={sectionTitleStyle}>Escopo</div>
                {/* The honest label. Static files cannot prove two repositories share
                    a production database, so a resource whose evidence was a compose
                    image or a Helm subchart says so out loud instead of implying a
                    shared instance that does not exist. */}
                <div style={{ fontSize: 12.5, marginTop: 4, color: T.ink2 }}>
                  {selectedNode.is_scoped
                    ? 'Local a este repositório'
                    : 'Compartilhado na organização'}
                </div>
              </div>
              {!selectedNode.is_scoped && selectedNode.host && (
                <div>
                  <div style={sectionTitleStyle}>Locator</div>
                  <div style={{ fontSize: 12, marginTop: 4, color: T.ink3, fontFamily: T.mono }}>
                    {selectedNode.host}
                    {selectedNode.port ? `:${selectedNode.port}` : ''}
                    {selectedNode.namespace ? `/${selectedNode.namespace}` : ''}
                  </div>
                </div>
              )}
              {selectedNode.evidence && selectedNode.evidence.length > 0 && (
                <div>
                  <div style={sectionTitleStyle}>Evidência</div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '4px 0 0' }}>
                    {selectedNode.evidence.map((path) => (
                      <li key={path} style={{ fontSize: 12, color: T.ink3, fontFamily: T.mono }}>
                        {path}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {selectedNode.kind !== 'repo' && selectedNode.rule_id && (
            <div>
              <div style={sectionTitleStyle}>Regra</div>
              <div style={{ fontSize: 12, marginTop: 4, color: T.ink3, fontFamily: T.mono }}>
                {selectedNode.rule_id}
              </div>
            </div>
          )}

          {ownerRepositoryID && (
            <Link
              href={`/code/repositories/${ownerRepositoryID}`}
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
          )}

          <div>
            <div style={sectionTitleStyle}>Saídas ({outgoing.length})</div>
            {outgoing.length === 0 ? (
              <div style={{ fontSize: 12, color: T.faint, marginTop: 4 }}>Nenhuma</div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: '4px 0 0', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {outgoing.map((e) => (
                  <li key={e.id} style={{ fontSize: 12, color: T.ink2, fontFamily: T.mono }}>
                    {RELATIONSHIP_KIND_LABELS[e.kind]}{' → '}
                    {nodes.find((n) => n.id === e.target)?.name ?? e.target}
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
                    {nodes.find((n) => n.id === e.source)?.name ?? e.source}
                    {' → '}
                    {RELATIONSHIP_KIND_LABELS[e.kind]}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Declaring a relationship starts from a repository. An API or a resource
              is derived from a repository's own files, so there is nothing to
              declare from one. */}
          {canManage && selectedNode.kind === 'repo' && (
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
          )}
        </div>
      </aside>
    )
  }

  return null
}
