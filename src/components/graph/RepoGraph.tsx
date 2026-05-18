'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  type Edge,
  type Node,
  type NodeMouseHandler,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { layoutWithDagre, type LayoutDirection } from '@/lib/graph/dagre-layout'
import { toReactFlowEdge } from '@/lib/graph/edge-styles'
import { RepositoryGraphEdge, RepositoryGraphNode } from '@/lib/types/graph'
import { RepoNode } from './RepoNode'
import { T } from '@/lib/tokens'

interface RepoGraphProps {
  nodes: RepositoryGraphNode[]
  edges: RepositoryGraphEdge[]
  direction?: LayoutDirection
  onNodeSelect?: (node: RepositoryGraphNode | null) => void
  onEdgeSelect?: (edge: RepositoryGraphEdge | null) => void
}

const nodeTypes = { repo: RepoNode }

function InnerGraph({ nodes, edges, direction = 'LR', onNodeSelect, onEdgeSelect }: RepoGraphProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  const { rfNodes, rfEdges } = useMemo(() => {
    const initialNodes: Node[] = nodes.map((n) => ({
      id: n.id,
      type: 'repo',
      position: { x: 0, y: 0 },
      data: n as unknown as Record<string, unknown>,
      selected: selectedNodeId === n.id,
    }))
    const initialEdges: Edge[] = edges.map((e) => toReactFlowEdge(e))
    const positioned = layoutWithDagre(initialNodes, initialEdges, { direction })
    return { rfNodes: positioned.nodes, rfEdges: positioned.edges }
    // We only re-layout when the data or direction change. Selection is purely visual.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, direction])

  // Keep selection visible by toggling the `selected` flag on a memoised copy.
  const decoratedNodes = useMemo(
    () => rfNodes.map((n) => ({ ...n, selected: n.id === selectedNodeId })),
    [rfNodes, selectedNodeId]
  )

  // Reset selection if the active node disappears.
  useEffect(() => {
    if (selectedNodeId && !nodes.some((n) => n.id === selectedNodeId)) {
      setSelectedNodeId(null)
      onNodeSelect?.(null)
    }
  }, [nodes, selectedNodeId, onNodeSelect])

  const handleNodeClick: NodeMouseHandler = (_event, node) => {
    setSelectedNodeId(node.id)
    const match = nodes.find((n) => n.id === node.id) ?? null
    onNodeSelect?.(match)
  }

  const handlePaneClick = () => {
    setSelectedNodeId(null)
    onNodeSelect?.(null)
    onEdgeSelect?.(null)
  }

  return (
    <ReactFlow
      nodes={decoratedNodes}
      edges={rfEdges}
      nodeTypes={nodeTypes}
      onNodeClick={handleNodeClick}
      onEdgeClick={(_event, edge) => {
        const match = edges.find((e) => e.id === edge.id) ?? null
        onEdgeSelect?.(match)
      }}
      onPaneClick={handlePaneClick}
      fitView
      proOptions={{ hideAttribution: true }}
      style={{ background: T.bg }}
    >
      <Background color={T.border} gap={20} />
      <MiniMap
        nodeColor={() => T.surfaceHover}
        nodeStrokeColor={() => T.border}
        maskColor={T.overlay}
        pannable
        zoomable
      />
      <Controls position="bottom-right" />
    </ReactFlow>
  )
}

export function RepoGraph(props: RepoGraphProps) {
  return (
    <ReactFlowProvider>
      <InnerGraph {...props} />
    </ReactFlowProvider>
  )
}
