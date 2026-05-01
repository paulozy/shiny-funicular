'use client'

import { CSSProperties, useState } from 'react'
import { RepositoryListResponse } from '@/lib/types/repository'
import { T } from '@/lib/tokens'
import { MFIcon, AISpark } from '@/components/icons/MFIcon'

interface RepositoryGridProps {
  repos: RepositoryListResponse
  showCreateModal?: () => void
}

type FilterType = 'todos' | 'hot' | 'alertas'

export function RepositoryGrid({ repos, showCreateModal }: RepositoryGridProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>('todos')

  const filtered = repos.repositories.filter((repo) => {
    if (activeFilter === 'hot') return (repo.metadata?.pr_count ?? 0) > 0
    if (activeFilter === 'alertas') return (repo.metadata?.issue_count ?? 0) > 0
    return true
  })

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  )

  const langColor = (provider: string) => {
    const colors: Record<string, string> = {
      github: '#000',
      gitlab: '#fb542b',
      gitea: '#34495e',
    }
    return colors[provider] || T.ink2
  }

  const containerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  }

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  }

  const titleStyle: CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
  }

  const dividerStyle: CSSProperties = {
    flex: 1,
    height: 1,
    background: T.border,
    border: 'none',
    margin: 0,
  }

  const captionStyle: CSSProperties = {
    fontSize: 11.5,
    color: T.faint,
  }

  const filtersStyle: CSSProperties = {
    display: 'flex',
    gap: 6,
    marginBottom: 10,
  }

  const filterButtonStyle = (active: boolean): CSSProperties => ({
    appearance: 'none',
    border: `1px solid ${T.borderStrong}`,
    background: active ? T.ink : T.surface,
    color: active ? '#fff' : T.ink,
    padding: '6px 12px',
    borderRadius: T.radius.button,
    font: '500 12.5px ' + T.font,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
  })

  const gridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
  }

  const cardStyle: CSSProperties = {
    backgroundColor: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.card,
    padding: '13px 15px',
  }

  const cardHeaderStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  }

  const langDotStyle: CSSProperties = {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  }

  const repoNameStyle: CSSProperties = {
    fontFamily: T.mono,
    fontSize: 13.5,
    fontWeight: 600,
    color: T.ink,
  }

  const tagStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '1px 7px',
    borderRadius: T.radius.tag,
    background: T.surfaceAlt,
    border: `1px solid ${T.border}`,
    fontSize: 11,
    color: T.ink2,
    fontWeight: 500,
    lineHeight: 1.5,
  }

  const descStyle: CSSProperties = {
    fontSize: 12,
    color: T.ink3,
    marginBottom: 8,
  }

  const footerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 11.5,
  }

  return (
    <div style={containerStyle}>
      <div>
        <div style={headerStyle}>
          <span style={titleStyle}>Repositórios</span>
          <hr style={dividerStyle} />
          <span style={captionStyle}>ordenado por atividade</span>
        </div>

        <div style={filtersStyle}>
          {(['todos', 'hot', 'alertas'] as FilterType[]).map((filter) => (
            <button
              key={filter}
              style={filterButtonStyle(activeFilter === filter)}
              onClick={() => setActiveFilter(filter)}
            >
              {filter === 'todos' && 'Todos'}
              {filter === 'hot' && 'Hot'}
              {filter === 'alertas' && 'Com Alertas'}
            </button>
          ))}
        </div>
      </div>

      {sorted.length === 0 ? (
        <div
          style={{
            padding: '40px',
            textAlign: 'center',
            color: T.faint,
            fontSize: 13,
          }}
        >
          Nenhum repositório encontrado
        </div>
      ) : (
        <div style={gridStyle}>
          {sorted.map((repo) => {
            const prCount = repo.metadata?.pr_count ?? 0
            const issueCount = repo.metadata?.issue_count ?? 0

            return (
              <div key={repo.id} style={cardStyle}>
                <div style={cardHeaderStyle}>
                  <div style={{ ...langDotStyle, background: langColor(repo.provider) }} />
                  <span style={repoNameStyle}>{repo.name}</span>
                  <span style={tagStyle}>{repo.provider}</span>
                  {prCount > 0 && (
                    <span
                      style={{
                        ...tagStyle,
                        background: T.accentBg,
                        borderColor: 'transparent',
                        color: T.accent,
                      }}
                    >
                      hot
                    </span>
                  )}
                  <span style={{ marginLeft: 'auto', fontSize: 10.5, color: T.faint }}>
                    {new Date(repo.updated_at).toLocaleString('pt-BR', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div style={descStyle}>{repo.description || 'Sem descrição'}</div>
                <div style={footerStyle}>
                  <span style={{ color: prCount > 0 ? T.ink2 : T.faint, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MFIcon name="pr" size={11} color={T.faint} /> {prCount} PRs
                  </span>
                  <span
                    style={{
                      color: issueCount > 0 ? T.danger : T.faint,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <MFIcon name="shield" size={11} color={issueCount > 0 ? T.danger : T.faint} /> {issueCount} alertas
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
