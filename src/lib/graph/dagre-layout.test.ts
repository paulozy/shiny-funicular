import type { Edge, Node } from '@xyflow/react'
import { layoutWithDagre } from './dagre-layout'

describe('layoutWithDagre', () => {
  it('assigns x/y positions and dimensions to every node', () => {
    const nodes: Node[] = [
      { id: 'a', position: { x: 0, y: 0 }, data: {} },
      { id: 'b', position: { x: 0, y: 0 }, data: {} },
      { id: 'c', position: { x: 0, y: 0 }, data: {} },
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
})
