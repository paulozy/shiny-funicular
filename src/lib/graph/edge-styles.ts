import type { Edge } from '@xyflow/react'
import { T } from '@/lib/tokens'
import {
  RELATIONSHIP_KIND_LABELS,
  RelationshipKind,
  RepositoryGraphEdge,
  isDeclaredEdge,
} from '@/lib/types/graph'

interface KindStyle {
  stroke: string
  strokeDasharray?: string
  label: string
}

/**
 * Visual mapping per relationship kind. We keep these in one place so the
 * RepoGraph component and any legend stay in sync.
 *
 * Library and infra edges render dashed since they typically represent
 * implicit coupling (a shared dependency) rather than a runtime call.
 */
export const KIND_STYLES: Record<RelationshipKind, KindStyle> = {
  http: { stroke: T.accent, label: RELATIONSHIP_KIND_LABELS.http },
  async: { stroke: T.ai, label: RELATIONSHIP_KIND_LABELS.async },
  library: { stroke: T.faint, strokeDasharray: '4 4', label: RELATIONSHIP_KIND_LABELS.library },
  data: { stroke: T.ok, label: RELATIONSHIP_KIND_LABELS.data },
  infra: { stroke: T.warn, strokeDasharray: '6 3', label: RELATIONSHIP_KIND_LABELS.infra },
  manual: { stroke: T.ink2, label: RELATIONSHIP_KIND_LABELS.manual },
  other: { stroke: T.borderStrong, label: RELATIONSHIP_KIND_LABELS.other },
  provides: { stroke: T.accent2 ?? T.accent, label: RELATIONSHIP_KIND_LABELS.provides },
  uses: { stroke: T.ok, strokeDasharray: '2 3', label: RELATIONSHIP_KIND_LABELS.uses },
}

/**
 * Certainty is two buckets, not a gradient.
 *
 * The previous encoding was `strokeWidth: 1 + confidence * 2`, which spreads
 * every edge across two pixels of line weight — practically invisible, and nobody
 * ranks seven stroke widths by eye anyway. Two states are legible at a glance:
 * a declaration is solid and full opacity; anything derived, or below the
 * certainty threshold, is dashed and dimmed.
 *
 * The rule this encodes is the one that does not bend: a derived edge must never
 * render like a human declaration. Being unable to tell an assertion from a guess
 * is what makes people stop trusting a catalog, and a catalog nobody trusts costs
 * maintenance while returning no decisions.
 */
export const CERTAIN_CONFIDENCE_FLOOR = 0.9

export type EdgeBucket = 'declared' | 'derived'

export function edgeBucket(edge: RepositoryGraphEdge): EdgeBucket {
  if (isDeclaredEdge(edge) && edge.confidence >= CERTAIN_CONFIDENCE_FLOOR) return 'declared'
  return 'derived'
}

const BUCKET_STYLES: Record<EdgeBucket, { strokeWidth: number; opacity: number; dash?: string }> = {
  declared: { strokeWidth: 2, opacity: 1 },
  derived: { strokeWidth: 1.5, opacity: 0.55, dash: '5 4' },
}

/**
 * Converts a backend graph edge into a React Flow edge with styling applied.
 */
export function toReactFlowEdge(edge: RepositoryGraphEdge): Edge {
  const kindStyle = KIND_STYLES[edge.kind] ?? KIND_STYLES.other
  const bucket = edgeBucket(edge)
  const bucketStyle = BUCKET_STYLES[bucket]

  return {
    id: edge.id,
    // Prefixed node ids, straight through: an edge can now end on an api or a
    // resource, so there is nothing repository-specific to unwrap.
    source: edge.source,
    target: edge.target,
    type: 'default',
    // Only the runtime-call kinds animate. Animating a `uses` or `provides` edge
    // would suggest traffic where there is only structure.
    animated: bucket === 'declared' && (edge.kind === 'http' || edge.kind === 'async'),
    // React Flow's edge `data` field must be a Record<string, unknown>. Cast
    // through unknown so we can retrieve the structured edge later via the
    // graph state instead of edge.data.
    data: { backendEdgeId: edge.id, bucket } as Record<string, unknown>,
    label: edge.label ?? kindStyle.label,
    labelStyle: { fontSize: 10, fill: T.ink3 },
    labelBgStyle: { fill: T.surface, opacity: 0.85 },
    labelBgPadding: [4, 2],
    style: {
      stroke: kindStyle.stroke,
      strokeWidth: bucketStyle.strokeWidth,
      // The bucket's dash wins over the kind's: certainty is the more important
      // distinction, and two dash patterns on one line read as neither.
      strokeDasharray: bucketStyle.dash ?? kindStyle.strokeDasharray,
      opacity: bucketStyle.opacity,
    },
  }
}
