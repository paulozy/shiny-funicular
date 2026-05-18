import type { Edge } from '@xyflow/react'
import { T } from '@/lib/tokens'
import { RELATIONSHIP_KIND_LABELS, RelationshipKind, RepositoryGraphEdge } from '@/lib/types/graph'

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
}

/**
 * Converts a backend graph edge into a React Flow edge with styling applied.
 * Stroke width is `1 + confidence * 2` so high-confidence edges visually
 * dominate inferred ones.
 */
export function toReactFlowEdge(edge: RepositoryGraphEdge): Edge {
  const kindStyle = KIND_STYLES[edge.kind] ?? KIND_STYLES.other
  return {
    id: edge.id,
    source: edge.source_repository_id,
    target: edge.target_repository_id,
    type: 'default',
    animated: edge.kind === 'http' || edge.kind === 'async',
    // React Flow's edge `data` field must be a Record<string, unknown>. Cast
    // through unknown so we can retrieve the structured edge later via the
    // graph state instead of edge.data.
    data: { backendEdgeId: edge.id } as Record<string, unknown>,
    label: edge.label ?? kindStyle.label,
    labelStyle: { fontSize: 10, fill: T.ink3 },
    labelBgStyle: { fill: T.surface, opacity: 0.85 },
    labelBgPadding: [4, 2],
    style: {
      stroke: kindStyle.stroke,
      strokeWidth: 1 + edge.confidence * 2,
      strokeDasharray: kindStyle.strokeDasharray,
    },
  }
}
