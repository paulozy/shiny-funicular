import dagre from '@dagrejs/dagre'
import type { Edge, Node } from '@xyflow/react'

export type LayoutDirection = 'LR' | 'TB' | 'RL' | 'BT'

interface LayoutOptions {
  direction?: LayoutDirection
  nodeWidth?: number
  nodeHeight?: number
  rankSep?: number
  nodeSep?: number
}

/**
 * Computes (x, y) coordinates for each node using dagre. Returns new Node/Edge
 * arrays — the inputs are NOT mutated. Use this in a `useMemo` on the client
 * side and feed the result into `<ReactFlow nodes={...} edges={...} />`.
 *
 * The width/height defaults match the RepoNode component visual size. If
 * RepoNode changes dimensions, update them here so dagre lays out without
 * overlaps.
 */
export function layoutWithDagre(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {}
): { nodes: Node[]; edges: Edge[] } {
  const {
    direction = 'LR',
    nodeWidth = 200,
    nodeHeight = 60,
    rankSep = 90,
    nodeSep = 40,
  } = options

  const graph = new dagre.graphlib.Graph()
  graph.setDefaultEdgeLabel(() => ({}))
  graph.setGraph({ rankdir: direction, ranksep: rankSep, nodesep: nodeSep })

  for (const node of nodes) {
    graph.setNode(node.id, { width: nodeWidth, height: nodeHeight })
  }
  for (const edge of edges) {
    graph.setEdge(edge.source, edge.target)
  }

  dagre.layout(graph)

  const positioned: Node[] = nodes.map((node) => {
    const dagreNode = graph.node(node.id)
    return {
      ...node,
      position: {
        // dagre returns the node's center; React Flow expects the top-left.
        x: dagreNode.x - nodeWidth / 2,
        y: dagreNode.y - nodeHeight / 2,
      },
      // React Flow 12 reads `node.width`/`node.height` before the DOM is
      // measured. Without these, `getNodeDimensions` returns 0×0 on the first
      // paint, so the MiniMap draws empty rects and the layout briefly flashes.
      width: nodeWidth,
      height: nodeHeight,
      // Tell React Flow which edge anchor sides to use based on direction.
      targetPosition: direction === 'LR' ? 'left' : direction === 'RL' ? 'right' : direction === 'TB' ? 'top' : 'bottom',
      sourcePosition: direction === 'LR' ? 'right' : direction === 'RL' ? 'left' : direction === 'TB' ? 'bottom' : 'top',
    } as Node
  })

  return { nodes: positioned, edges }
}
