'use client'

import { CSSProperties } from 'react'
import Link from 'next/link'
import { RepositoryResponse } from '@/lib/types/repository'
import { T } from '@/lib/tokens'

interface DecisionQueueProps {
  repositories: RepositoryResponse[]
}

interface Decision {
  id: string
  text: string
  action: string
  href: string
}

/**
 * "Precisa de decisão" — the governance backlog the catalog can prove from
 * data it already has: repositories nobody owns, and repositories whose last
 * sync failed. Anything that needs a human to decide, not to read.
 */
export function buildDecisions(repositories: RepositoryResponse[]): Decision[] {
  const ownerless = repositories
    .filter((repo) => !repo.owner_team)
    .map((repo) => ({
      id: `owner-${repo.id}`,
      text: `${repo.name} está sem time responsável`,
      action: 'Atribuir time',
      href: `/code/repositories/${repo.id}/settings`,
    }))

  const broken = repositories
    .filter((repo) => repo.sync_status === 'error')
    .map((repo) => ({
      id: `sync-${repo.id}`,
      text: `A última sincronização de ${repo.name} falhou`,
      action: 'Ver repositório',
      href: `/code/repositories/${repo.id}`,
    }))

  return [...broken, ...ownerless].slice(0, 6)
}

export function DecisionQueue({ repositories }: DecisionQueueProps) {
  const decisions = buildDecisions(repositories)

  const cardStyle: CSSProperties = {
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.card,
  }

  const headerStyle: CSSProperties = {
    padding: '16px 18px',
    borderBottom: `1px solid ${T.border}`,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  }

  const actionStyle: CSSProperties = {
    fontSize: 12.5,
    fontWeight: 600,
    padding: '6px 12px',
    borderRadius: T.radius.button,
    border: `1px solid ${T.border}`,
    background: T.surface,
    color: T.ink,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  }

  return (
    <section style={cardStyle}>
      <div style={headerStyle}>
        <h2 style={{ fontSize: 16, margin: 0 }}>Precisa de decisão</h2>
        <span
          style={{
            background: T.neutral100,
            color: T.neutral800,
            borderRadius: T.radius.tag,
            padding: '3px 9px',
            fontSize: 11,
          }}
        >
          {decisions.length}
        </span>
      </div>

      {decisions.length === 0 ? (
        <div style={{ padding: '26px 18px', fontSize: 13.5, color: T.faint }}>
          Sem pendências de governança.
        </div>
      ) : (
        <div>
          {decisions.map((decision) => (
            <div
              key={decision.id}
              style={{
                padding: '14px 18px',
                borderBottom: `1px solid ${T.neutral200}`,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <span style={{ fontSize: 13.5, flex: 1, minWidth: 240 }}>{decision.text}</span>
              <Link href={decision.href} style={actionStyle}>
                {decision.action}
              </Link>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
