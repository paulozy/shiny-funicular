'use client'

import { CSSProperties } from 'react'
import { T } from '@/lib/tokens'
import { PullRequestList } from '@/components/pull-requests/PullRequestList'
import { PullRequestListItemResponse } from '@/lib/types/pull_request'
import { RepositoryResponse } from '@/lib/types/repository'

interface PullRequestsClientProps {
  items: PullRequestListItemResponse[]
  repo: RepositoryResponse
  loadError: string | null
}

export function PullRequestsClient({ items, repo, loadError }: PullRequestsClientProps) {
  const headerStyle: CSSProperties = {
    marginBottom: 14,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  }

  const titleStyle: CSSProperties = {
    fontSize: 16,
    fontWeight: 600,
    color: T.ink,
    margin: 0,
  }

  const subtitleStyle: CSSProperties = {
    fontSize: 12,
    color: T.faint,
  }

  const errorStyle: CSSProperties = {
    padding: 16,
    borderRadius: T.radius.card,
    border: `1px solid ${T.dangerBorder}`,
    background: T.dangerBg,
    color: T.danger,
    fontSize: 13,
    marginBottom: 14,
  }

  return (
    <div style={{ padding: '16px 0' }}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Pull Requests de {repo.name}</h1>
        <span style={subtitleStyle}>
          Pull requests abertos no GitHub. Clique no título para abrir no GitHub.
        </span>
      </div>

      {loadError && (
        <div style={errorStyle} role="alert">
          Não foi possível carregar os PRs: {loadError}
        </div>
      )}

      {!loadError && <PullRequestList items={items} />}
    </div>
  )
}
