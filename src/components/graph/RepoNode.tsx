'use client'

import { CSSProperties } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { T } from '@/lib/tokens'
import { RepositoryGraphNode } from '@/lib/types/graph'

const PROVIDER_COLORS: Record<string, string> = {
  github: T.providerGithub,
  gitlab: T.providerGitlab,
  gitea: T.providerGitea,
}

/**
 * Custom React Flow node for a repository in the graph view. Designed for the
 * ~200x60 dimensions that `layoutWithDagre` assumes.
 */
export function RepoNode({ data, selected }: NodeProps) {
  const node = data as unknown as RepositoryGraphNode
  const dotColor = PROVIDER_COLORS[node.type] ?? T.ink2

  const containerStyle: CSSProperties = {
    minWidth: 180,
    maxWidth: 220,
    padding: '8px 10px',
    border: `1px solid ${selected ? T.accent : T.border}`,
    borderRadius: 8,
    background: T.surface,
    boxShadow: selected ? `0 0 0 2px ${T.accentBg}` : '0 1px 2px rgba(0,0,0,.06)',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  }

  const titleStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12.5,
    fontWeight: 600,
    color: T.ink,
    fontFamily: T.mono,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  }

  const subtitleStyle: CSSProperties = {
    fontSize: 11,
    color: T.faint,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  }

  const statusTone =
    node.analysis_status === 'completed'
      ? T.ok
      : node.analysis_status === 'failed'
        ? T.danger
        : node.analysis_status === 'in_progress'
          ? T.accent
          : T.faint

  return (
    <div style={containerStyle}>
      {/* React Flow connection handles. We hide them visually but keep them for edge anchoring. */}
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <div style={titleStyle}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
        <span title={node.name}>{node.name}</span>
      </div>
      <div style={subtitleStyle}>
        <span style={{ color: statusTone }}>●</span>
        <span>{node.type}</span>
      </div>
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  )
}
