'use client'

import { CSSProperties, useState } from 'react'
import { T } from '@/lib/tokens'
import { PullRequestList, PullRequestFilter } from '@/components/pull-requests/PullRequestList'
import { PullRequestListItemResponse } from '@/lib/types/pull_request'
import { RepositoryResponse } from '@/lib/types/repository'
import { Segmented } from '@/components/ui/Segmented'
import {
  PullRequestDrawer,
  PullRequestDrawerTarget,
} from '@/components/pull-requests/PullRequestDrawer'

interface PullRequestsClientProps {
  items: PullRequestListItemResponse[]
  repo: RepositoryResponse
  loadError: string | null
  /** Whether the viewer's role allows submitting a review verdict. */
  canReview?: boolean
}

export function PullRequestsClient({
  items,
  repo,
  loadError,
  canReview = false,
}: PullRequestsClientProps) {
  const [filter, setFilter] = useState<PullRequestFilter>('open')
  const [target, setTarget] = useState<PullRequestDrawerTarget | null>(null)

  const errorStyle: CSSProperties = {
    padding: '14px 16px',
    borderRadius: T.radius.card,
    border: `1px solid ${T.dangerBorder}`,
    background: T.dangerBg,
    color: T.danger,
    fontSize: 13,
    marginBottom: 18,
  }

  if (loadError) {
    return (
      <div style={errorStyle} role="alert">
        Não foi possível carregar os PRs de {repo.name}: {loadError}
      </div>
    )
  }

  return (
    <div>
      <Segmented
        name="repo-pr-filter"
        ariaLabel="Filtrar pull requests"
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'open', label: 'Abertos' },
          { value: 'draft', label: 'Draft' },
          { value: 'all', label: 'Todos' },
        ]}
        style={{ marginBottom: 18 }}
      />

      <PullRequestList
        items={items}
        repoId={repo.id}
        filter={filter}
        onSelect={(pr) =>
          setTarget({
            repoId: repo.id,
            number: pr.number,
            title: pr.title,
            repoName: repo.name,
            provider: repo.provider ?? repo.type,
          })
        }
      />

      <PullRequestDrawer
        target={target}
        onClose={() => setTarget(null)}
        canReview={canReview}
      />
    </div>
  )
}
