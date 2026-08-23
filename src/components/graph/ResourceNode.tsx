'use client'

import { CSSProperties } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { T } from '@/lib/tokens'
import { ResourceGraphNode } from '@/lib/types/graph'
import { NODE_SIZES } from '@/lib/graph/dagre-layout'

/**
 * The cylinder silhouette, the conventional shape for a datastore.
 *
 * `is_scoped` is rendered, not hidden. Static files cannot prove two repositories
 * share a production database, so a resource whose only evidence was a compose
 * image or a Helm subchart says "local" on its face — implying a shared instance
 * that does not exist is exactly the failure this label prevents.
 *
 * Dimensions match `NODE_SIZES.resource`.
 */
export function ResourceNode({ data, selected }: NodeProps) {
  const node = data as unknown as ResourceGraphNode
  const size = NODE_SIZES.resource

  const containerStyle: CSSProperties = {
    width: size.width,
    height: size.height,
    padding: '6px 10px',
    border: `1px solid ${selected ? T.accent : T.border}`,
    // A large horizontal radius reads as the top and bottom ellipses of a
    // cylinder without needing an SVG.
    borderRadius: '50% / 18%',
    background: T.surfaceAlt,
    boxShadow: selected ? `0 0 0 2px ${T.accentBg}` : 'none',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    boxSizing: 'border-box',
    textAlign: 'center',
  }

  return (
    <div style={containerStyle}>
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <span
        title={node.name}
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: T.ink,
          fontFamily: T.mono,
          maxWidth: '100%',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
        }}
      >
        {node.engine}
      </span>
      <span style={{ fontSize: 9, color: node.is_scoped ? T.faint : T.ok }}>
        {node.is_scoped ? 'local' : 'compartilhado'}
      </span>
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  )
}
