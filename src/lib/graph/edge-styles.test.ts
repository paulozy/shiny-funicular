import { CERTAIN_CONFIDENCE_FLOOR, edgeBucket, toReactFlowEdge } from './edge-styles'
import { RepositoryGraphEdge } from '@/lib/types/graph'

function makeEdge(overrides: Partial<RepositoryGraphEdge> = {}): RepositoryGraphEdge {
  return {
    id: 'edge-1',
    source: 'repo:a',
    target: 'repo:b',
    kind: 'library',
    provenance: 'manual',
    confidence: 1,
    ...overrides,
  }
}

describe('edgeBucket', () => {
  // The rule that does not bend: a derived edge must never render like a human
  // declaration. Being unable to tell an assertion from a guess is what makes
  // people stop trusting a catalog.
  it('puts an edge with a derivation key in the derived bucket', () => {
    expect(edgeBucket(makeEdge({ derivation_key: 'libdep:v1:org/o1' }))).toBe('derived')
  })

  it('puts an edge with no derivation key in the declared bucket', () => {
    expect(edgeBucket(makeEdge())).toBe('declared')
  })

  // A declaration recorded at low confidence is still uncertain, so certainty and
  // provenance both feed the cut.
  it('demotes a low-confidence edge even without a derivation key', () => {
    expect(edgeBucket(makeEdge({ confidence: 0.5 }))).toBe('derived')
    expect(edgeBucket(makeEdge({ confidence: CERTAIN_CONFIDENCE_FLOOR }))).toBe('declared')
  })
})

describe('toReactFlowEdge', () => {
  it('passes the prefixed node ids straight through', () => {
    const edge = toReactFlowEdge(makeEdge({ source: 'repo:a', target: 'api:x' }))
    expect(edge.source).toBe('repo:a')
    expect(edge.target).toBe('api:x')
  })

  // The previous encoding was `strokeWidth: 1 + confidence * 2`, spreading every
  // edge across two pixels of line weight. Two states are legible at a glance.
  it('renders the derived bucket dashed and dimmed', () => {
    // `http` has no dash of its own, so the bucket's is the only one in play.
    const derived = toReactFlowEdge(makeEdge({ kind: 'http', derivation_key: 'libdep:v1:org/o1' }))
    const declared = toReactFlowEdge(makeEdge({ kind: 'http' }))

    expect(derived.style?.strokeDasharray).toBeTruthy()
    expect(Number(derived.style?.opacity)).toBeLessThan(1)
    expect(Number(declared.style?.opacity)).toBe(1)
    expect(declared.style?.strokeDasharray).toBeFalsy()
  })

  // Certainty is the more important distinction, and two dash patterns on one line
  // read as neither — so the bucket's dash wins over the kind's.
  it('lets the bucket dash override the kind dash', () => {
    const declaredLibrary = toReactFlowEdge(makeEdge({ kind: 'library' }))
    const derivedLibrary = toReactFlowEdge(
      makeEdge({ kind: 'library', derivation_key: 'libdep:v1:org/o1' })
    )

    expect(declaredLibrary.style?.strokeDasharray).toBe('4 4')
    expect(derivedLibrary.style?.strokeDasharray).not.toBe('4 4')
  })

  it('exposes the bucket on the edge data so a legend can agree with the canvas', () => {
    const edge = toReactFlowEdge(makeEdge({ derivation_key: 'libdep:v1:org/o1' }))
    expect((edge.data as Record<string, unknown>).bucket).toBe('derived')
  })

  // Animating a `uses` or `provides` edge would suggest traffic where there is
  // only structure, and animating a derived edge would give a guess the most
  // attention-grabbing treatment on the canvas.
  it('animates only declared runtime-call edges', () => {
    expect(toReactFlowEdge(makeEdge({ kind: 'http' })).animated).toBe(true)
    expect(toReactFlowEdge(makeEdge({ kind: 'async' })).animated).toBe(true)
    expect(toReactFlowEdge(makeEdge({ kind: 'uses' })).animated).toBe(false)
    expect(
      toReactFlowEdge(makeEdge({ kind: 'http', derivation_key: 'apiconsume:v1:org/o1' })).animated
    ).toBe(false)
  })

  it('styles the new provides and uses kinds without falling back to other', () => {
    for (const kind of ['provides', 'uses'] as const) {
      const edge = toReactFlowEdge(makeEdge({ kind }))
      expect(edge.style?.stroke).toBeTruthy()
      expect(edge.label).toBeTruthy()
    }
  })
})
