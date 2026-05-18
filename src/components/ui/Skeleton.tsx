import { CSSProperties } from 'react'

interface SkeletonProps {
  /** Width in CSS units (px or %). Default: 100% */
  width?: number | string
  /** Height in CSS units (px). Default: 12 */
  height?: number | string
  /** Border radius. Default: 4 */
  radius?: number | string
  /** Inline style overrides. */
  style?: CSSProperties
  /** Optional explicit aria-label for screen readers. */
  'aria-label'?: string
}

/**
 * Minimal animated placeholder used while a route or panel is loading.
 *
 * The actual color/animation live in `globals.css` under `.skeleton`/
 * `.skeleton-shimmer` so the dark-mode and `prefers-reduced-motion` handling
 * stays in one place.
 */
export function Skeleton({
  width = '100%',
  height = 12,
  radius = 4,
  style,
  'aria-label': ariaLabel = 'Carregando…',
}: SkeletonProps) {
  return (
    <div
      role="status"
      aria-label={ariaLabel}
      className="skeleton skeleton-shimmer"
      style={{
        width,
        height,
        borderRadius: typeof radius === 'number' ? `${radius}px` : radius,
        ...style,
      }}
    />
  )
}

interface SkeletonTextProps {
  /** Number of lines to render. Default: 3 */
  lines?: number
  /** Vertical gap between lines (px). Default: 8 */
  gap?: number
  /** Width of the LAST line as a percentage of the rest. Default: 70 */
  lastLineWidth?: number
}

/** A block of N text-line skeletons with a slightly shorter last line. */
export function SkeletonText({ lines = 3, gap = 8, lastLineWidth = 70 }: SkeletonTextProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={12}
          width={i === lines - 1 ? `${lastLineWidth}%` : '100%'}
        />
      ))}
    </div>
  )
}

interface SkeletonCardProps {
  /** Card height in px. Default: 140 */
  height?: number
}

/** Rectangular block matching the visual rhythm of `RepositoryGrid` cards. */
export function SkeletonCard({ height = 140 }: SkeletonCardProps) {
  return <Skeleton height={height} radius={8} aria-label="Carregando card…" />
}

export function SkeletonAvatar({ size = 32 }: { size?: number }) {
  return (
    <Skeleton
      width={size}
      height={size}
      radius="50%"
      aria-label="Carregando avatar…"
    />
  )
}
