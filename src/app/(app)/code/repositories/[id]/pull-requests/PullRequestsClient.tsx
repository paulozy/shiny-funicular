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
  const pageStyle: CSSProperties = {
    padding: '24px 28px 32px',
  }

  const headerStyle: CSSProperties = {
    marginBottom: 22,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  }

  const titleStyle: CSSProperties = {
    fontSize: 20,
    fontWeight: 600,
    color: T.ink,
    margin: 0,
    letterSpacing: '-0.01em',
  }

  const subtitleStyle: CSSProperties = {
    fontSize: 12.5,
    color: T.ink3,
  }

  const errorStyle: CSSProperties = {
    padding: '14px 16px',
    borderRadius: T.radius.card,
    border: `1px solid ${T.dangerBorder}`,
    background: T.dangerBg,
    color: T.danger,
    fontSize: 13,
    marginBottom: 18,
  }

  const totalLabel = `${items.length} PR${items.length === 1 ? '' : 's'} aberto${
    items.length === 1 ? '' : 's'
  }`

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Pull Requests de {repo.name}</h1>
        <span style={subtitleStyle}>
          {loadError
            ? 'Não foi possível listar os PRs do GitHub.'
            : `${totalLabel} · clique no título de qualquer PR para abrir no GitHub.`}
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
