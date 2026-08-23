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
 * Rendered size per node kind.
 *
 * dagre accepts a width and height per node, and it has to be given them: a
 * single 200×60 for every kind was correct while `repo` was the only kind, and
 * with three shapes it produces either overlap (an oversized node in an
 * undersized cell) or large empty gutters (the reverse). These values match the
 * components — RepoNode, ApiNode, ResourceNode — so changing one means changing
 * the other.
 */
export const NODE_SIZES: Record<string, { width: number; height: number }> = {
  repo: { width: 200, height: 60 },
  api: { width: 160, height: 36 },
  resource: { width: 140, height: 48 },
}

/** DEFAULT_NODE_SIZE is what an unrecognized kind falls back to. */
export const DEFAULT_NODE_SIZE = NODE_SIZES.repo

/**
 * sizeForNode reads a node's kind off its React Flow `type`, falling back to the
 * default rather than throwing. An unknown kind laying out slightly wrong is far
 * better than a graph that fails to render.
 */
export function sizeForNode(node: Node): { width: number; height: number } {
  return NODE_SIZES[node.type ?? ''] ?? DEFAULT_NODE_SIZE
}

/**
 * Computes (x, y) coordinates for each node using dagre. Returns new Node/Edge
 * arrays — the inputs are NOT mutated. Use this in a `useMemo` on the client
 * side and feed the result into `<ReactFlow nodes={...} edges={...} />`.
 *
 * Dagre stays the layout engine on purpose. Layered (Sugiyama-family) layout is
 * the right family for a directed dependency graph: it minimises crossings and
 * makes direction legible. A force-directed layout (d3-force, cytoscape)
 * optimises cluster visibility and would lose direction, which is the primary
 * information here.
 *
 * `nodeWidth`/`nodeHeight` remain as overrides for a caller that wants one size
 * for everything; by default each node is sized by its kind.
 */
export function layoutWithDagre(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {}
): { nodes: Node[]; edges: Edge[] } {
  const { direction = 'LR', nodeWidth, nodeHeight, rankSep = 90, nodeSep = 40 } = options

  const graph = new dagre.graphlib.Graph()
  graph.setDefaultEdgeLabel(() => ({}))
  graph.setGraph({ rankdir: direction, ranksep: rankSep, nodesep: nodeSep })

  const sizes = new Map<string, { width: number; height: number }>()
  for (const node of nodes) {
    const size = {
      width: nodeWidth ?? sizeForNode(node).width,
      height: nodeHeight ?? sizeForNode(node).height,
    }
    sizes.set(node.id, size)
    graph.setNode(node.id, size)
  }
  for (const edge of edges) {
    // An edge whose endpoint is not in the node list would make dagre invent a
    // phantom node and lay the graph out around it. The server already prunes
    // dangling edges; this is the second line of defence.
    if (!sizes.has(edge.source) || !sizes.has(edge.target)) continue
    graph.setEdge(edge.source, edge.target)
  }

  dagre.layout(graph)

  const positioned: Node[] = nodes.map((node) => {
    const dagreNode = graph.node(node.id)
    const size = sizes.get(node.id) ?? DEFAULT_NODE_SIZE
    return {
      ...node,
      position: {
        // dagre returns the node's center; React Flow expects the top-left.
        x: dagreNode.x - size.width / 2,
        y: dagreNode.y - size.height / 2,
      },
      // React Flow 12 reads `node.width`/`node.height` before the DOM is
      // measured. Without these, `getNodeDimensions` returns 0×0 on the first
      // paint, so the MiniMap draws empty rects and the layout briefly flashes.
      width: size.width,
      height: size.height,
      // Tell React Flow which edge anchor sides to use based on direction.
      targetPosition: direction === 'LR' ? 'left' : direction === 'RL' ? 'right' : direction === 'TB' ? 'top' : 'bottom',
      sourcePosition: direction === 'LR' ? 'right' : direction === 'RL' ? 'left' : direction === 'TB' ? 'bottom' : 'top',
    } as Node
  })

  return { nodes: positioned, edges }
}
