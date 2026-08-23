'use client'

import { CSSProperties } from 'react'
import { ContributorResponse, contributorLabel } from '@/lib/types/contributor'
import { Alert } from '@/components/ui/Alert'
import { timeAgo } from '@/lib/relative-time'
import { T } from '@/lib/tokens'

interface ContributorsClientProps {
  items: ContributorResponse[]
  loadError: string | null
}

export function ContributorsClient({ items, loadError }: ContributorsClientProps) {
  if (loadError) {
    return <Alert variant="warn">Não foi possível carregar os contribuidores: {loadError}</Alert>
  }

  if (items.length === 0) {
    return (
      <p style={{ fontSize: 13.5, color: T.neutral600, margin: 0 }}>
        Nenhum contribuidor reportado por este repositório.
      </p>
    )
  }

  return (
    <div style={panelStyle}>
      {items.map((contributor, index) => {
        const label = contributorLabel(contributor)
        return (
          <div key={`${contributor.login || contributor.name}-${index}`} style={rowStyle}>
            <span style={avatarStyle} aria-hidden="true">
              {label.charAt(0).toUpperCase()}
            </span>
            <span style={{ minWidth: 200 }}>
              <span style={{ display: 'block', fontSize: 14, fontWeight: 600 }}>{label}</span>
              {/* Only one of the two identities exists per provider, so the
                  second line is shown only when it adds something. */}
              {contributor.login && contributor.name && (
                <span
                  style={{
                    display: 'block',
                    fontFamily: T.mono,
                    fontSize: 12,
                    color: T.neutral600,
                    marginTop: 2,
                  }}
                >
                  {contributor.login}
                </span>
              )}
            </span>
            <span style={{ flex: 1 }} />
            <span style={{ fontSize: 12.5, color: T.neutral700 }}>{meta(contributor)}</span>
          </div>
        )
      })}
    </div>
  )
}

/**
 * "240 commits · 2 PRs abertos · último commit há 3h".
 *
 * The last two segments are dropped when the backend sent null, which means it
 * could not determine them — not that they are zero. Rendering "0 PRs abertos"
 * for a contributor we simply could not match would be a confident wrong
 * answer, which is exactly what the nullable fields exist to prevent.
 */
function meta(contributor: ContributorResponse): string {
  const parts = [
    contributor.commits === 1 ? '1 commit' : `${contributor.commits} commits`,
  ]
  if (contributor.open_change_requests !== null) {
    parts.push(
      contributor.open_change_requests === 1
        ? '1 PR aberto'
        : `${contributor.open_change_requests} PRs abertos`
    )
  }
  if (contributor.last_commit_at !== null) {
    parts.push(`último commit ${timeAgo(contributor.last_commit_at)}`)
  }
  return parts.join(' · ')
}

const panelStyle: CSSProperties = {
  background: T.surface,
  border: `1px solid ${T.border}`,
  borderRadius: T.radius.card,
  padding: '8px 20px 20px',
}

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '14px 0',
  borderBottom: `1px solid ${T.neutral200}`,
  flexWrap: 'wrap',
}

const avatarStyle: CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: '50%',
  background: T.accent100,
  color: T.accent800,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 13,
  fontWeight: 600,
  flexShrink: 0,
}
