'use client'

import { CSSProperties, ReactNode } from 'react'
import { RepositoryListResponse, RepositoryResponse } from '@/lib/types/repository'
import { OrganizationConfigResponse } from '@/lib/types/organization'
import { SearchInsight } from '@/lib/types/search'
import { openIssueCount } from '@/lib/repo-metrics'
import { T } from '@/lib/tokens'
import { MFIcon, AISpark } from '@/components/icons/MFIcon'
import { SearchSynthesisCard } from '@/components/home/SearchSynthesisCard'
import { useCoPensadorScope } from '@/components/shell/CoPensadorScopeProvider'

interface CoPensadorProps {
  repos: RepositoryListResponse
  orgConfig?: OrganizationConfigResponse | null
  focusedRepo?: RepositoryResponse | null
  searchInsight?: SearchInsight | null
}

interface CoPCard {
  icon: string
  title: string
  tone: string
  description: ReactNode
}

export function CoPensador({ repos, orgConfig, focusedRepo, searchInsight }: CoPensadorProps) {
  // The CoPensador lives in the persistent app layout, but the relevant
  // context (search query insight, route-specific framing) is published from
  // the leaf client components via `usePublishScope`. Reading the scope here
  // lets the panel render route-aware insights without prop drilling.
  const { scope } = useCoPensadorScope()
  const insight = scope?.kind === 'repo-search' ? scope.insight ?? null : searchInsight ?? null

  const cards: CoPCard[] = []

  if (focusedRepo) {
    const issues = openIssueCount(focusedRepo.metadata)
    const branch = focusedRepo.metadata?.default_branch || 'main'

    if (issues > 0) {
      cards.push({
        icon: 'shield',
        title: 'Issues no repo',
        tone: T.danger,
        description: `${issues} issue${issues !== 1 ? 's' : ''} aberta${issues !== 1 ? 's' : ''} no GitHub em ${focusedRepo.name}.`,
      })
    }

    cards.push({
      icon: 'search',
      title: 'Busca semântica',
      tone: T.ai,
      description: `Use a busca em ${branch} para localizar fluxos, decisões e pontos de entrada sem depender de nomes exatos.`,
    })

    if (orgConfig && !orgConfig.voyage_api_key_configured) {
      cards.push({
        icon: 'gear',
        title: 'Voyage pendente',
        tone: T.warn,
        description: 'A chave Voyage ainda não está configurada. A busca semântica depende dela para gerar e consultar embeddings.',
      })
    }

    // Route-specific insights — appended *after* the generic repo cards so the
    // panel keeps a consistent baseline while still adapting to where the
    // user is.
    if (scope?.kind === 'repo-pulls') {
      cards.unshift({
        icon: 'pr',
        title: 'Revisando PRs',
        tone: T.accent,
        description: 'Clique em qualquer PR para abrir o detalhe no GitHub.',
      })
    }
  } else {
    const reposWithIssues = repos.repositories.filter((r) => openIssueCount(r.metadata) > 0)
    if (reposWithIssues.length > 0) {
      cards.push({
        icon: 'shield',
        title: 'Repos com issues',
        tone: T.danger,
        description: (
          <div>
            <div>{reposWithIssues.length} repositórios com issues abertas no GitHub</div>
            <ul style={{ margin: '4px 0 0 0', paddingLeft: 16, fontSize: 11.5 }}>
              {reposWithIssues.slice(0, 3).map((r) => (
                <li key={r.id}>{r.name}</li>
              ))}
            </ul>
          </div>
        ),
      })
    }

    const configKeys = [
      { key: 'github_token_configured', label: 'GitHub Token' },
      { key: 'anthropic_api_key_configured', label: 'Chave Anthropic' },
      { key: 'voyage_api_key_configured', label: 'Chave Voyage' },
    ] as const
    const missingKeys = configKeys.filter((item) => !orgConfig?.[item.key])

    if (orgConfig && missingKeys.length > 0) {
      cards.push({
        icon: 'gear',
        title: 'Configuração incompleta',
        tone: T.warn,
        description: (
          <div>
            <div>{missingKeys.length} configurações faltando</div>
            <ul style={{ margin: '4px 0 0 0', paddingLeft: 16, fontSize: 11.5 }}>
              {missingKeys.map((item) => (
                <li key={item.key}>{item.label}</li>
              ))}
            </ul>
          </div>
        ),
      })
    }
  }

  // Fallback: all clear
  if (cards.length === 0) {
    cards.push({
      icon: 'check',
      title: focusedRepo ? 'Sem pendências neste repo' : 'Sem pendências',
      tone: T.ok,
      description: focusedRepo ? 'Nenhum alerta relevante com os dados atuais.' : 'Tudo em dia.',
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
        <span style={contextStyle}>contexto: {focusedRepo ? focusedRepo.name : `Code · ${repos.total} repos`}</span>
      </div>

      <div style={contentStyle}>
        <div style={{ fontSize: 10.5, fontWeight: 600, color: T.faint, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {cards.length + (insight ? 1 : 0)} insight{cards.length + (insight ? 1 : 0) !== 1 ? 's' : ''}
        </div>

        {insight && <SearchSynthesisCard repoId={focusedRepo?.id} insight={insight} />}

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
