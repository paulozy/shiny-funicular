import { CSSProperties } from 'react'
import { T } from '@/lib/tokens'
import { Button } from '@/components/ui/Button'

interface SearchStateProps {
  title: string
  description?: string
  actionLabel?: string
  loading?: boolean
  onAction?: () => void
}

export function SearchState({
  title,
  description,
  actionLabel,
  loading,
  onAction,
}: SearchStateProps) {
  const style: CSSProperties = {
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.card,
    padding: 24,
    color: T.ink,
  }

  return (
    <div style={style}>
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{title}</div>
      {description && <div style={{ fontSize: 13, color: T.ink3, maxWidth: 620 }}>{description}</div>}
      {actionLabel && onAction && (
        <div style={{ marginTop: 14 }}>
          <Button variant="primary" size="md" onClick={onAction} loading={loading}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  )
}

export function SearchSkeleton() {
  const shimmer: CSSProperties = {
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.card,
    padding: 14,
  }

  const line = (width: string, height = 12): CSSProperties => ({
    width,
    height,
    borderRadius: 4,
    background: T.surfaceAlt,
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[0, 1, 2, 3, 4].map((item) => (
        <div key={item} style={shimmer}>
          <div style={line('42%', 14)} />
          <div style={{ height: 10 }} />
          <div style={line('24%')} />
          <div style={{ height: 12 }} />
          <div style={line('100%', 74)} />
        </div>
      ))}
    </div>
  )
}
