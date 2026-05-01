'use client'

import { CSSProperties, ReactNode } from 'react'
import { RepositoryListResponse } from '@/lib/types/repository'
import { OrganizationConfigResponse } from '@/lib/types/organization'
import { T } from '@/lib/tokens'
import { MFIcon, AISpark } from '@/components/icons/MFIcon'

interface CoPensadorProps {
  repos: RepositoryListResponse
  orgConfig?: OrganizationConfigResponse | null
}

interface CoPCard {
  icon: string
  title: string
  tone: string
  description: ReactNode
}

export function CoPensador({ repos, orgConfig }: CoPensadorProps) {
  const cards: CoPCard[] = []

  // Rule 1: Repos with issues
  const reposWithIssues = repos.repositories.filter((r) => (r.metadata?.issue_count ?? 0) > 0)
  if (reposWithIssues.length > 0) {
    cards.push({
      icon: 'shield',
      title: 'Repos com alertas',
      tone: T.danger,
      description: (
        <div>
          <div>{reposWithIssues.length} repositórios com alertas</div>
          <ul style={{ margin: '4px 0 0 0', paddingLeft: 16, fontSize: 11.5 }}>
            {reposWithIssues.slice(0, 3).map((r) => (
              <li key={r.id}>{r.name}</li>
            ))}
          </ul>
        </div>
      ),
    })
  }

  // Rule 2: Low coverage
  const coverageValues = repos.repositories
    .map((r) => r.metadata?.test_coverage)
    .filter((val): val is number => val !== undefined && val !== null)

  const avgCoverage = coverageValues.length > 0 ? Math.round(coverageValues.reduce((a, b) => a + b, 0) / coverageValues.length) : null

  const reposWithLowCoverage = repos.repositories.filter((r) => {
    const cov = r.metadata?.test_coverage
    return cov === undefined || cov < 60
  })

  if (reposWithLowCoverage.length > 0) {
    cards.push({
      icon: 'check',
      title: 'Cobertura de testes baixa',
      tone: T.warn,
      description: (
        <div>
          <div>
            {reposWithLowCoverage.length} repos com cobertura {'<'} 60%
          </div>
          {avgCoverage !== null && <div style={{ marginTop: 4, fontSize: 11.5 }}>Média: {avgCoverage}%</div>}
        </div>
      ),
    })
  }

  // Rule 3: Incomplete organization config
  const configKeys = ['github_token', 'anthropic_key', 'voyage_key'] as const
  const missingKeys = configKeys.filter((key) => !orgConfig?.[key])

  if (orgConfig && missingKeys.length > 0) {
    cards.push({
      icon: 'gear',
      title: 'Configuração incompleta',
      tone: T.warn,
      description: (
        <div>
          <div>{missingKeys.length} configurações faltando</div>
          <ul style={{ margin: '4px 0 0 0', paddingLeft: 16, fontSize: 11.5 }}>
            {missingKeys.map((key) => (
              <li key={key}>
                {key === 'github_token' && 'GitHub Token'}
                {key === 'anthropic_key' && 'Chave Anthropic'}
                {key === 'voyage_key' && 'Chave Voyage'}
              </li>
            ))}
          </ul>
        </div>
      ),
    })
  }

  // Fallback: all clear
  if (cards.length === 0) {
    cards.push({
      icon: 'check',
      title: 'Sem pendências',
      tone: T.ok,
      description: 'Tudo em dia! 🎉',
    })
  }

  const panelStyle: CSSProperties = {
    padding: '12px 14px',
    borderBottom: `1px solid ${T.border}`,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  }

  const titleStyle: CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
  }

  const contextStyle: CSSProperties = {
    marginLeft: 'auto',
    fontSize: 10.5,
    color: T.faint,
  }

  const contentStyle: CSSProperties = {
    flex: 1,
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    overflow: 'auto',
  }

  const cardStyle: CSSProperties = {
    border: `1px solid ${T.borderStrong}`,
    background: T.surface,
    borderRadius: 8,
    padding: '10px 12px',
  }

  const cardHeaderStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  }

  const cardTitleStyle: CSSProperties = {
    fontSize: 11.5,
    fontWeight: 600,
  }

  const cardDescStyle: CSSProperties = {
    fontSize: 12.5,
    color: T.ink,
    lineHeight: 1.5,
  }

  const footerStyle: CSSProperties = {
    padding: 12,
    borderTop: `1px solid ${T.border}`,
  }

  const promptBoxStyle: CSSProperties = {
    border: `1px solid ${T.borderStrong}`,
    borderRadius: 8,
    padding: '7px 10px',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: T.surface,
  }

  const promptTextStyle: CSSProperties = {
    fontSize: 12,
    color: T.faint,
    flex: 1,
  }

  return (
    <>
      <div style={panelStyle}>
        <AISpark size={14} />
        <span style={titleStyle}>Co-pensador</span>
        <span style={contextStyle}>contexto: Code · {repos.total} repos</span>
      </div>

      <div style={contentStyle}>
        <div style={{ fontSize: 10.5, fontWeight: 600, color: T.faint, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {cards.length} insight{cards.length !== 1 ? 's' : ''}
        </div>

        {cards.map((card, i) => (
          <div key={i} style={cardStyle}>
            <div style={cardHeaderStyle}>
              <MFIcon name={card.icon} size={12} color={card.tone} />
              <span style={{ ...cardTitleStyle, color: card.tone }}>{card.title}</span>
            </div>
            <div style={cardDescStyle}>{card.description}</div>
          </div>
        ))}
      </div>

      <div style={footerStyle}>
        <div style={promptBoxStyle}>
          <AISpark size={12} />
          <span style={promptTextStyle}>pergunte sobre qualquer repo…</span>
          <span
            style={{
              fontSize: 10.5,
              padding: '1px 5px',
              border: `1px solid ${T.border}`,
              borderRadius: 4,
              background: T.surface,
              color: T.ink3,
              fontFamily: T.mono,
            }}
          >
            ⌘J
          </span>
        </div>
      </div>
    </>
  )
}
