'use client'

import { CSSProperties, useCallback, useMemo, useState } from 'react'
import { UserInfo } from '@/lib/types/auth'
import {
  RELATIONSHIP_KINDS,
  RELATIONSHIP_KIND_LABELS,
  RelationshipKind,
  RepositoryGraphEdge,
  RepositoryGraphNode,
  RepositoryGraphResponse,
} from '@/lib/types/graph'
import { apiFetch } from '@/lib/api/client'
import { T } from '@/lib/tokens'
import { AppShell } from '@/components/shell/AppShell'
import { CodeHubTabBar } from '@/components/shell/CodeHubTabBar'
import { RepoGraph } from '@/components/graph/RepoGraph'
import { RelationshipDrawer } from '@/components/graph/RelationshipDrawer'
import { RelationshipModal } from '@/components/graph/RelationshipModal'
import { KIND_STYLES } from '@/lib/graph/edge-styles'
import { Button } from '@/components/ui/Button'
import { MFIcon } from '@/components/icons/MFIcon'

interface GraphClientProps {
  user: UserInfo
  initialGraph: RepositoryGraphResponse
}

export function GraphClient({ user, initialGraph }: GraphClientProps) {
  const [nodes, setNodes] = useState<RepositoryGraphNode[]>(initialGraph.nodes)
  const [edges, setEdges] = useState<RepositoryGraphEdge[]>(initialGraph.edges)
  const [selectedNode, setSelectedNode] = useState<RepositoryGraphNode | null>(null)
  const [selectedEdge, setSelectedEdge] = useState<RepositoryGraphEdge | null>(null)
  const [kindFilters, setKindFilters] = useState<Set<RelationshipKind>>(
    new Set(RELATIONSHIP_KINDS)
  )
  const [modalState, setModalState] = useState<
    | { open: false }
    | { open: true; mode: 'create'; sourceId?: string | null }
    | { open: true; mode: 'edit'; edge: RepositoryGraphEdge }
  >({ open: false })

  const visibleEdges = useMemo(
    () => edges.filter((e) => kindFilters.has(e.kind)),
    [edges, kindFilters]
  )

  const handleKindToggle = (kind: RelationshipKind) => {
    setKindFilters((prev) => {
      const next = new Set(prev)
      if (next.has(kind)) next.delete(kind)
      else next.add(kind)
      return next
    })
  }

  const refresh = useCallback(async () => {
    try {
      const graph = await apiFetch<RepositoryGraphResponse>(
        '/api/repositories/graph?include_metadata=true',
        { method: 'GET' }
      )
      setNodes(graph.nodes)
      setEdges(graph.edges)
    } catch {
      // ignore — UI keeps last good state
    }
  }, [])

  const handleEdgeCreatedOrUpdated = useCallback((edge: RepositoryGraphEdge) => {
    setEdges((prev) => {
      const idx = prev.findIndex((e) => e.id === edge.id)
      if (idx === -1) return [...prev, edge]
      const copy = [...prev]
      copy[idx] = edge
      return copy
    })
    setSelectedEdge(edge)
  }, [])

  const handleDelete = useCallback(
    async (edge: RepositoryGraphEdge) => {
      if (!window.confirm(`Remover esta relação ${RELATIONSHIP_KIND_LABELS[edge.kind]}?`)) return
      try {
        await apiFetch<void>(`/api/repository-relationships/${edge.id}`, { method: 'DELETE' })
        setEdges((prev) => prev.filter((e) => e.id !== edge.id))
        setSelectedEdge(null)
      } catch {
        // keep state — refresh will reconcile
        refresh()
      }
    },
    [refresh]
  )

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 20px',
    borderBottom: `1px solid ${T.border}`,
    background: T.surface,
    flexWrap: 'wrap',
  }

  const chipStyle = (active: boolean, color: string): CSSProperties => ({
    appearance: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 10px',
    border: `1px solid ${active ? color : T.border}`,
    borderRadius: T.radius.tag,
    background: active ? T.surface : T.surfaceAlt,
    color: active ? T.ink : T.faint,
    fontSize: 11.5,
    cursor: 'pointer',
  })

  const splitStyle: CSSProperties = {
    flex: 1,
    display: 'flex',
    minHeight: 0,
  }

  const graphContainerStyle: CSSProperties = {
    flex: 1,
    minWidth: 0,
    background: T.bg,
  }

  return (
    <AppShell
      user={user}
      activeHub="code"
      breadcrumb={[{ label: 'Code', href: '/' }, { label: 'Grafo' }]}
      topRight={
        <Button
          variant="primary"
          size="md"
          onClick={() => setModalState({ open: true, mode: 'create' })}
          disabled={nodes.length < 2}
          title={nodes.length < 2 ? 'Crie pelo menos 2 repositórios primeiro' : undefined}
        >
          <MFIcon name="plus" size={12} />
          Nova relação
        </Button>
      }
    >
      <CodeHubTabBar activeTab="graph" />

      <div style={headerStyle}>
        <span style={{ fontSize: 11.5, color: T.faint, fontWeight: 500 }}>Filtrar por tipo:</span>
        {RELATIONSHIP_KINDS.map((kind) => {
          const active = kindFilters.has(kind)
          const color = KIND_STYLES[kind].stroke
          return (
            <button
              key={kind}
              type="button"
              onClick={() => handleKindToggle(kind)}
              style={chipStyle(active, color)}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
              {RELATIONSHIP_KIND_LABELS[kind]}
            </button>
          )
        })}
        <span style={{ marginLeft: 'auto', fontSize: 11.5, color: T.faint }}>
          {nodes.length} repositórios · {visibleEdges.length}/{edges.length} relações visíveis
        </span>
      </div>

      <div style={splitStyle}>
        <div style={graphContainerStyle}>
          {nodes.length === 0 ? (
            <div
              style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: T.faint,
                fontSize: 13,
              }}
            >
              Crie repositórios para visualizá-los no grafo.
            </div>
          ) : (
            <RepoGraph
              nodes={nodes}
              edges={visibleEdges}
              onNodeSelect={(node) => {
                setSelectedNode(node)
                setSelectedEdge(null)
              }}
              onEdgeSelect={(edge) => {
                setSelectedEdge(edge)
                setSelectedNode(null)
              }}
            />
          )}
        </div>

        <RelationshipDrawer
          selectedNode={selectedNode}
          selectedEdge={selectedEdge}
          nodes={nodes}
          edges={edges}
          onCreateRelationship={() =>
            setModalState({
              open: true,
              mode: 'create',
              sourceId: selectedNode?.id ?? null,
            })
          }
          onEditRelationship={(edge) => setModalState({ open: true, mode: 'edit', edge })}
          onDeleteRelationship={handleDelete}
          onClose={() => {
            setSelectedNode(null)
            setSelectedEdge(null)
          }}
        />
      </div>

      <RelationshipModal
        isOpen={modalState.open}
        onClose={() => setModalState({ open: false })}
        nodes={nodes}
        initialEdge={modalState.open && modalState.mode === 'edit' ? modalState.edge : null}
        initialSourceId={
          modalState.open && modalState.mode === 'create' ? modalState.sourceId ?? null : null
        }
        onSuccess={handleEdgeCreatedOrUpdated}
      />
    </AppShell>
  )
}
