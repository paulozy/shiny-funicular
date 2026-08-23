'use client'

import { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { UserInfo } from '@/lib/types/auth'
import {
  GRAPH_NODE_KINDS,
  GRAPH_NODE_KIND_LABELS,
  GraphNodeKind,
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
import { RepoGraph } from '@/components/graph/RepoGraph'
import { RelationshipDrawer } from '@/components/graph/RelationshipDrawer'
import { RelationshipModal } from '@/components/graph/RelationshipModal'
import { KIND_STYLES } from '@/lib/graph/edge-styles'
import { Button } from '@/components/ui/Button'
import { canManageRelationships } from '@/lib/permissions'

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
  // Node-kind toggles. The default matches the server's: resources are off,
  // because they are the most numerous and least precise layer and leading with
  // them would make the graph's first impression its noisiest.
  const [nodeKinds, setNodeKinds] = useState<Set<GraphNodeKind>>(new Set(['repo', 'api']))
  // The certainty threshold. It does more for legibility than any per-edge
  // encoding: it is what lets a person see "only what is certain" in one click.
  const [minConfidence, setMinConfidence] = useState(0)
  const [expanded, setExpanded] = useState(false)
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

  const graphQuery = useMemo(() => {
    const params = new URLSearchParams({ include_metadata: 'true' })
    // `repo` is always sent by the server, so only the optional kinds need
    // naming; sorting keeps the URL stable so the fetch is cacheable.
    params.set('node_kinds', [...nodeKinds].sort().join(','))
    if (minConfidence > 0) params.set('min_confidence', String(minConfidence))
    return `/api/repositories/graph?${params.toString()}`
  }, [nodeKinds, minConfidence])

  const refresh = useCallback(async () => {
    try {
      const graph = await apiFetch<RepositoryGraphResponse>(graphQuery, { method: 'GET' })
      setNodes(graph.nodes)
      setEdges(graph.edges)
    } catch {
      // ignore — UI keeps last good state
    }
  }, [graphQuery])

  // Both filters are applied server-side, because a node kind that is off must not
  // be fetched at all — that is the point of the toggle, given the node count can
  // multiply several times over with resources on.
  //
  // The ref holds the query the payload we already have was fetched with. The page
  // server-renders with the same defaults, so without this the first mount would
  // refetch an identical graph — two requests to draw one canvas.
  const fetchedQuery = useRef(graphQuery)
  useEffect(() => {
    if (fetchedQuery.current === graphQuery) return
    fetchedQuery.current = graphQuery
    refresh()
  }, [graphQuery, refresh])

  const handleNodeKindToggle = (kind: GraphNodeKind) => {
    // Repositories are never optional: every other node hangs off one, so hiding
    // them would leave APIs and resources floating with no owner visible.
    if (kind === 'repo') return
    setNodeKinds((prev) => {
      const next = new Set(prev)
      if (next.has(kind)) next.delete(kind)
      else next.add(kind)
      return next
    })
  }

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
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  }

  const chipStyle = (active: boolean, color: string): CSSProperties => ({
    appearance: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '5px 12px',
    border: `1px solid ${active ? color : T.border}`,
    borderRadius: 999,
    background: active ? T.surface : 'transparent',
    color: active ? T.ink : T.faint,
    fontSize: 12.5,
    cursor: 'pointer',
  })

  const splitStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 300px',
    gap: 20,
    alignItems: 'stretch',
  }

  // The canvas is the page. It takes the viewport minus the shell chrome and
  // the header above it, with a floor so a short window still shows a graph
  // and not a strip.
  const graphContainerStyle: CSSProperties = {
    minWidth: 0,
    position: 'relative',
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.card,
    overflow: 'hidden',
    height: expanded ? '100%' : 'clamp(520px, calc(100vh - 300px), 900px)',
  }

  const placeholderStyle: CSSProperties = {
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.card,
    padding: 18,
    fontSize: 13.5,
    color: T.faint,
    lineHeight: 1.55,
    alignSelf: 'start',
  }

  const mayManage = canManageRelationships(user)

  const expandButtonStyle: CSSProperties = {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 5,
    font: 'inherit',
    fontSize: 12.5,
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.button,
    color: T.ink3,
    padding: '5px 10px',
    cursor: 'pointer',
  }

  const graphCanvas = (
    <div style={graphContainerStyle}>
      <button type="button" style={expandButtonStyle} onClick={() => setExpanded((open) => !open)}>
        {expanded ? 'Sair da tela cheia' : 'Tela cheia'}
      </button>
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
          showMiniMap={expanded}
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
  )

  const detailsColumn = (
    <>
      {!selectedNode && !selectedEdge && (
        <div style={placeholderStyle}>
          Clique em um nó ou em uma aresta para ver os detalhes da relação.
        </div>
      )}

      <RelationshipDrawer
        selectedNode={selectedNode}
        selectedEdge={selectedEdge}
        nodes={nodes}
        edges={edges}
        canManage={mayManage}
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
    </>
  )

  return (
    <AppShell
      user={user}
      activeHub="arch"
      topRight={
        mayManage ? (
        <Button
          variant="primary"
          size="md"
          onClick={() => setModalState({ open: true, mode: 'create' })}
          disabled={nodes.length < 2}
          title={nodes.length < 2 ? 'Crie pelo menos 2 repositórios primeiro' : undefined}
        >
          Nova relação
        </Button>
        ) : undefined
      }
    >
      <h1 style={{ fontSize: 26, margin: '0 0 6px' }}>Grafo de dependências</h1>
      <p style={{ fontSize: 14, color: T.ink3, margin: '0 0 18px' }}>
        {nodes.filter((n) => n.kind === 'repo').length} repositórios · {nodes.length} nós ·{' '}
        {visibleEdges.length} de {edges.length} relações visíveis.
      </p>

      <div style={headerStyle}>
        {GRAPH_NODE_KINDS.map((kind) => {
          const active = nodeKinds.has(kind)
          const locked = kind === 'repo'
          return (
            <button
              key={kind}
              type="button"
              onClick={() => handleNodeKindToggle(kind)}
              disabled={locked}
              aria-pressed={active}
              title={locked ? 'Repositórios são sempre exibidos' : undefined}
              style={{
                ...chipStyle(active, T.ink2),
                cursor: locked ? 'default' : 'pointer',
                fontWeight: 600,
              }}
            >
              {GRAPH_NODE_KIND_LABELS[kind]}
            </button>
          )
        })}
        <label
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11.5,
            color: T.ink3,
            marginLeft: 4,
          }}
        >
          Confiança ≥ {minConfidence.toFixed(2)}
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={minConfidence}
            onChange={(e) => setMinConfidence(Number(e.target.value))}
            aria-label="Confiança mínima"
            style={{ width: 96 }}
          />
        </label>
      </div>

      <div style={headerStyle}>
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
      </div>

      {/* One canvas at a time: mounting the inline graph behind the overlay
          would run two React Flow instances over the same data. */}
      {!expanded && (
        <div style={splitStyle}>
          {graphCanvas}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            {detailsColumn}
          </div>
        </div>
      )}

      {expanded && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 60,
            background: T.bg,
            padding: 16,
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 320px',
            gap: 16,
          }}
        >
          {graphCanvas}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, overflow: 'auto' }}>
            {detailsColumn}
          </div>
        </div>
      )}

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
