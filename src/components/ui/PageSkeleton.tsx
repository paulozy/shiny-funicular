import { CSSProperties } from 'react'
import { T } from '@/lib/tokens'
import { Skeleton, SkeletonCard, SkeletonText } from './Skeleton'

export type PageSkeletonVariant = 'grid' | 'split' | 'list' | 'detail'

interface PageSkeletonProps {
  /**
   * How the body of the skeleton is laid out:
   * - `grid`: 6 card placeholders in a responsive grid (Templates, Home).
   * - `split`: 280px sidebar + main pane (Docs).
   * - `list`: stacked rows (Settings).
   * - `detail`: 2-column structure with side tree + content (Template detail).
   */
  variant?: PageSkeletonVariant
  /** Hide the eyebrow / title block at the top. */
  hideHeader?: boolean
}

/**
 * Full-page placeholder rendered by `loading.tsx` files while the real RSC
 * tree is still streaming. Mirrors the visual rhythm of the actual pages so
 * the layout doesn't pop when content arrives.
 */
export function PageSkeleton({ variant = 'grid', hideHeader = false }: PageSkeletonProps) {
  const wrapperStyle: CSSProperties = {
    padding: '20px 24px 28px',
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  }

  return (
    <div style={wrapperStyle} aria-busy="true" aria-live="polite">
      {!hideHeader && <SkeletonHeader />}
      {variant === 'grid' && <GridBody />}
      {variant === 'split' && <SplitBody />}
      {variant === 'list' && <ListBody />}
      {variant === 'detail' && <DetailBody />}
    </div>
  )
}

function SkeletonHeader() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Skeleton width={120} height={10} aria-label="Carregando eyebrow…" />
      <Skeleton width="40%" height={22} aria-label="Carregando título…" />
    </div>
  )
}

function GridBody() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 12,
      }}
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

function SplitBody() {
  return (
    <div
      style={{
        display: 'flex',
        gap: 14,
        flex: 1,
        minHeight: 360,
      }}
    >
      <aside
        style={{
          width: 280,
          minWidth: 240,
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: 8,
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} height={48} radius={6} />
        ))}
      </aside>
      <div
        style={{
          flex: 1,
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: 8,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <Skeleton width="35%" height={20} />
        <SkeletonText lines={6} />
        <Skeleton height={140} radius={6} />
      </div>
    </div>
  )
}

function ListBody() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 8,
        padding: 16,
      }}
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} height={28} radius={6} />
      ))}
    </div>
  )
}

function DetailBody() {
  return (
    <div style={{ display: 'flex', gap: 14, flex: 1, minHeight: 400 }}>
      <aside
        style={{
          width: 240,
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: 8,
          padding: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} height={20} radius={4} />
        ))}
      </aside>
      <div
        style={{
          flex: 1,
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: 8,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <Skeleton width="45%" height={20} />
        <SkeletonText lines={12} />
      </div>
    </div>
  )
}
