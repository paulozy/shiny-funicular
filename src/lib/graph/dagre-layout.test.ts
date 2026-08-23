import type { Edge, Node } from '@xyflow/react'
import { DEFAULT_NODE_SIZE, NODE_SIZES, layoutWithDagre } from './dagre-layout'

describe('layoutWithDagre', () => {
  it('assigns x/y positions and dimensions to every node', () => {
    const nodes: Node[] = [
      { id: 'a', type: 'repo', position: { x: 0, y: 0 }, data: {} },
      { id: 'b', type: 'repo', position: { x: 0, y: 0 }, data: {} },
      { id: 'c', type: 'repo', position: { x: 0, y: 0 }, data: {} },
    ]
    const edges: Edge[] = [
      { id: 'a-b', source: 'a', target: 'b' },
      { id: 'b-c', source: 'b', target: 'c' },
    ]

    const result = layoutWithDagre(nodes, edges)

    expect(result.nodes).toHaveLength(3)
    for (const node of result.nodes) {
      expect(typeof node.position.x).toBe('number')
      expect(typeof node.position.y).toBe('number')
      expect(Number.isFinite(node.position.x)).toBe(true)
      expect(Number.isFinite(node.position.y)).toBe(true)
      // React Flow 12 needs explicit dimensions before DOM measurement so the
      // MiniMap can draw rects on the first paint (instead of 0×0 ghosts).
      expect(node.width).toBe(200)
      expect(node.height).toBe(60)
    }
  })

  it('lays out nodes left-to-right by default (source x < target x for an edge)', () => {
    const nodes: Node[] = [
      { id: 'src', position: { x: 0, y: 0 }, data: {} },
      { id: 'dst', position: { x: 0, y: 0 }, data: {} },
    ]
    const edges: Edge[] = [{ id: 'e', source: 'src', target: 'dst' }]

    const { nodes: positioned } = layoutWithDagre(nodes, edges)

    const src = positioned.find((n) => n.id === 'src')!
    const dst = positioned.find((n) => n.id === 'dst')!
    expect(src.position.x).toBeLessThan(dst.position.x)
  })

  it('respects the TB (top-bottom) direction option', () => {
    const nodes: Node[] = [
      { id: 'a', position: { x: 0, y: 0 }, data: {} },
      { id: 'b', position: { x: 0, y: 0 }, data: {} },
    ]
    const edges: Edge[] = [{ id: 'e', source: 'a', target: 'b' }]

    const { nodes: positioned } = layoutWithDagre(nodes, edges, { direction: 'TB' })

    const a = positioned.find((n) => n.id === 'a')!
    const b = positioned.find((n) => n.id === 'b')!
    expect(a.position.y).toBeLessThan(b.position.y)
  })

  it('does not mutate the input arrays', () => {
    const nodes: Node[] = [{ id: 'a', position: { x: 0, y: 0 }, data: {} }]
    const edges: Edge[] = []

    const result = layoutWithDagre(nodes, edges)

    expect(nodes[0].position).toEqual({ x: 0, y: 0 })
    expect(result.nodes).not.toBe(nodes)
  })

  // A pill and a cylinder are not 200×60. Passing dagre one size for every kind
  // produces either overlap (an oversized node in an undersized cell) or large
  // empty gutters, and both make the graph harder to read.
  it('sizes each node by its kind', () => {
    const nodes: Node[] = [
      { id: 'r', type: 'repo', position: { x: 0, y: 0 }, data: {} },
      { id: 'a', type: 'api', position: { x: 0, y: 0 }, data: {} },
      { id: 's', type: 'resource', position: { x: 0, y: 0 }, data: {} },
    ]
    const edges: Edge[] = [
      { id: 'r-a', source: 'r', target: 'a' },
      { id: 'r-s', source: 'r', target: 's' },
    ]

    const { nodes: positioned } = layoutWithDagre(nodes, edges)
    const byID = Object.fromEntries(positioned.map((n) => [n.id, n]))

    expect(byID.r.width).toBe(NODE_SIZES.repo.width)
    expect(byID.r.height).toBe(NODE_SIZES.repo.height)
    expect(byID.a.width).toBe(NODE_SIZES.api.width)
    expect(byID.a.height).toBe(NODE_SIZES.api.height)
    expect(byID.s.width).toBe(NODE_SIZES.resource.width)
    expect(byID.s.height).toBe(NODE_SIZES.resource.height)
  })

  // An unknown kind laying out slightly wrong is far better than a graph that
  // fails to render, so the fallback is silent rather than a throw.
  it('falls back to the default size for an unknown kind', () => {
    const nodes: Node[] = [{ id: 'x', type: 'component', position: { x: 0, y: 0 }, data: {} }]

    const { nodes: positioned } = layoutWithDagre(nodes, [])

    expect(positioned[0].width).toBe(DEFAULT_NODE_SIZE.width)
    expect(positioned[0].height).toBe(DEFAULT_NODE_SIZE.height)
    expect(Number.isFinite(positioned[0].position.x)).toBe(true)
  })

  // An edge whose endpoint is missing would make dagre invent a phantom node and
  // lay the whole graph out around it.
  it('ignores an edge whose endpoint is not in the node list', () => {
    const nodes: Node[] = [{ id: 'a', type: 'repo', position: { x: 0, y: 0 }, data: {} }]
    const edges: Edge[] = [{ id: 'dangling', source: 'a', target: 'ghost' }]

    const { nodes: positioned } = layoutWithDagre(nodes, edges)

    expect(positioned).toHaveLength(1)
    expect(Number.isFinite(positioned[0].position.x)).toBe(true)
  })

  // The node's own position must be centred correctly for its own size, or a
  // small node renders offset from where dagre placed it.
  it('converts the dagre centre to a top-left using that node\'s size', () => {
    const nodes: Node[] = [{ id: 'a', type: 'api', position: { x: 0, y: 0 }, data: {} }]

    const { nodes: positioned } = layoutWithDagre(nodes, [])

    // dagre puts a lone node at (width/2, height/2), so the top-left is the origin.
    expect(positioned[0].position.x).toBeCloseTo(0)
    expect(positioned[0].position.y).toBeCloseTo(0)
  })
})
