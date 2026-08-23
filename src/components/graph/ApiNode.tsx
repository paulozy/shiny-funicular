'use client'

import { CSSProperties } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { T } from '@/lib/tokens'
import { ApiGraphNode } from '@/lib/types/graph'
import { NODE_SIZES } from '@/lib/graph/dagre-layout'

const SPEC_KIND_LABELS: Record<string, string> = {
  openapi: 'OpenAPI',
  asyncapi: 'AsyncAPI',
  graphql: 'GraphQL',
  grpc: 'gRPC',
}

/**
 * A pill, deliberately smaller and flatter than a repository card.
 *
 * The shape carries the type: a person scanning the canvas should be able to tell
 * a contract from a service without reading either. Dimensions match
 * `NODE_SIZES.api` so dagre lays this out without overlap or gutters.
 */
export function ApiNode({ data, selected }: NodeProps) {
  const node = data as unknown as ApiGraphNode
  const size = NODE_SIZES.api

  const containerStyle: CSSProperties = {
    width: size.width,
    height: size.height,
    padding: '0 10px',
    border: `1px solid ${selected ? T.accent : T.border}`,
    // Fully rounded: the pill shape is the type marker.
    borderRadius: size.height / 2,
    background: T.surfaceAlt,
    boxShadow: selected ? `0 0 0 2px ${T.accentBg}` : 'none',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    boxSizing: 'border-box',
  }

  return (
    <div style={containerStyle}>
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <span
        aria-hidden
        style={{ width: 6, height: 6, borderRadius: '50%', background: T.accent2, flexShrink: 0 }}
      />
      <span
        title={`${node.name} · ${node.spec_path}`}
        style={{
          fontSize: 11.5,
          fontWeight: 600,
          color: T.ink,
          fontFamily: T.mono,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
        }}
      >
        {node.name}
      </span>
      <span style={{ fontSize: 9.5, color: T.faint, flexShrink: 0, marginLeft: 'auto' }}>
        {SPEC_KIND_LABELS[node.spec_kind] ?? node.spec_kind}
      </span>
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  )
}
