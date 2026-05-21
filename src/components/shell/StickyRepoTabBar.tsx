'use client'

import { CSSProperties } from 'react'
import { T } from '@/lib/tokens'
import { RepoTabBar } from './RepoTabBar'

/**
 * Sticky wrapper around `RepoTabBar`. Lives at the top of the per-repo layout
 * so the tabs persist across navigation between sub-routes and never scroll
 * out of view on long pages (Alertas, Arquivos, etc).
 */
export function StickyRepoTabBar({ repoId }: { repoId: string }) {
  const wrapStyle: CSSProperties = {
    position: 'sticky',
    top: 0,
    zIndex: 10,
    background: T.surfaceAlt,
    borderBottom: `1px solid ${T.border}`,
  }
  return (
    <div style={wrapStyle}>
      <RepoTabBar repoId={repoId} />
    </div>
  )
}
