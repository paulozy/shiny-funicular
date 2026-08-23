'use client'

import { CSSProperties, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { RepositoryResponse } from '@/lib/types/repository'
import { apiFetch } from '@/lib/api/client'
import { timeAgo } from '@/lib/relative-time'
import { T } from '@/lib/tokens'
import { Button } from '@/components/ui/Button'
import { Tag } from '@/components/ui/Tag'

interface RepositoryHeaderProps {
  repo: RepositoryResponse
  canSync?: boolean
}

/**
 * The repository identity block, shared by every tab of the repository scope.
 *
 * v3 puts it above the tab row and keeps it there while the person moves
 * between overview, pull requests and settings — which is why it lives in the
 * layout rather than in each page.
 */
export function RepositoryHeader({ repo, canSync = false }: RepositoryHeaderProps) {
  const router = useRouter()
  const [syncing, setSyncing] = useState(false)

  const branch = repo.metadata?.default_branch || 'main'

  async function handleSync() {
    setSyncing(true)
    try {
      await apiFetch(`/api/repositories/${repo.id}/sync`, { method: 'POST' })
      router.refresh()
    } catch {
      // The sync endpoint is throttled server-side and the next page load
      // shows the outcome; a failed manual trigger is not worth a modal.
    } finally {
      setSyncing(false)
    }
  }

  const metaRowStyle: CSSProperties = {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 10,
    fontSize: 12.5,
    color: T.faint,
  }

  return (
    <div>
      <Link
        href="/"
        style={{
          fontSize: 13,
          color: T.accent700,
          textDecoration: 'none',
          display: 'inline-block',
          marginBottom: 14,
        }}
      >
        ← Code Hub
      </Link>

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 18,
          flexWrap: 'wrap',
          marginBottom: 18,
        }}
      >
        <div style={{ minWidth: 280 }}>
          <h1 style={{ fontSize: 26, margin: 0, fontFamily: T.mono, letterSpacing: '-0.01em' }}>
            {repo.name}
          </h1>
          {repo.description && (
            <div style={{ fontSize: 13.5, color: T.ink3, marginTop: 6 }}>{repo.description}</div>
          )}
          <div style={metaRowStyle}>
            <Tag>{repo.provider}</Tag>
            <Tag>{repo.is_private ? 'privado' : 'público'}</Tag>
            <span>
              branch <span style={{ fontFamily: T.mono }}>{branch}</span>
            </span>
            <span>·</span>
            <span>atualizado {timeAgo(repo.updated_at)}</span>
            <span>·</span>
            <span style={{ color: repo.owner_team ? T.ink3 : T.warn }}>
              {repo.owner_team ? `time ${repo.owner_team.name}` : 'sem time responsável'}
            </span>
          </div>
        </div>

        <span style={{ flex: 1 }} />

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {canSync && (
            <Button variant="default" size="md" onClick={handleSync} loading={syncing}>
              Sincronizar agora
            </Button>
          )}
          {repo.url && (
            <a
              href={repo.url}
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: 13,
                fontWeight: 600,
                padding: '7px 13px',
                borderRadius: T.radius.button,
                border: `1px solid ${T.border}`,
                background: T.surface,
                color: T.ink,
                textDecoration: 'none',
              }}
            >
              Abrir origem
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
