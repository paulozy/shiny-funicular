'use client'

import { CSSProperties, ReactNode } from 'react'
import { RepositoryListResponse, RepositoryResponse } from '@/lib/types/repository'
import { OrganizationConfigResponse } from '@/lib/types/organization'
import { SearchInsight } from '@/lib/types/search'
import { getRepositoryStats, qualityTone } from '@/lib/repository-analysis'
import { T } from '@/lib/tokens'
import { MFIcon, AISpark } from '@/components/icons/MFIcon'
import { SearchSynthesisCard } from '@/components/home/SearchSynthesisCard'

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
  const cards: CoPCard[] = []

  if (focusedRepo) {
    const issues = focusedRepo.metadata?.issue_count ?? 0
    const coverage = focusedRepo.metadata?.test_coverage
    const branch = focusedRepo.metadata?.default_branch || 'main'
    const stats = getRepositoryStats(focusedRepo)

    if (focusedRepo.analysis_status === 'failed') {
      cards.push({
        icon: 'x',
        title: 'Análise falhou',
        tone: T.danger,
        description: 'A última análise deste repositório falhou. Verifique configurações e credenciais antes de confiar nos sinais de qualidade.',
      })
    } else if (!stats.has_analysis) {
      cards.push({
        icon: 'database',
        title: 'Repo sem análise',
        tone: T.warn,
        description: 'Este repositório ainda não tem análise de qualidade. O score 0 do backend representa ausência de análise, não baixa qualidade.',
      })
    } else if (stats.latest_quality_score < 70) {
      cards.push({
        icon: 'trophy',
        title: 'Qualidade baixa',
        tone: qualityTone(stats.latest_quality_score, T),
        description: `Última análise marcou ${Math.round(stats.latest_quality_score)}/100. Use a busca para localizar os pontos de maior impacto antes de refatorar.`,
      })
    }

    if (issues > 0) {
      cards.push({
        icon: 'shield',
        title: 'Alertas no repo',
        tone: T.danger,
        description: `${issues} alerta${issues !== 1 ? 's' : ''} em ${focusedRepo.name}. Priorize os trechos mais sensíveis antes de novas mudanças.`,
      })
    }

    if (coverage === undefined || coverage < 60) {
      cards.push({
        icon: 'check',
        title: 'Cobertura baixa',
        tone: T.warn,
        description: coverage === undefined
          ? 'Cobertura não detectada. Busque por testes existentes antes de abrir novas refatorações.'
          : `Cobertura em ${Math.round(coverage)}%. Vale buscar hotspots sem testes antes de evoluir o repo.`,
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
  } else {
    const reposWithoutAnalysis = repos.repositories.filter((r) => !getRepositoryStats(r).has_analysis)
    const reposWithFailedAnalysis = repos.repositories.filter((r) => r.analysis_status === 'failed')
    const reposWithLowQuality = repos.repositories.filter((r) => {
      const stats = getRepositoryStats(r)
      return stats.has_analysis && stats.latest_quality_score < 70
    })

    if (reposWithFailedAnalysis.length > 0) {
      cards.push({
        icon: 'x',
        title: 'Análises com falha',
        tone: T.danger,
        description: (
          <div>
            <div>{reposWithFailedAnalysis.length} repositórios com análise falha</div>
            <ul style={{ margin: '4px 0 0 0', paddingLeft: 16, fontSize: 11.5 }}>
              {reposWithFailedAnalysis.slice(0, 3).map((r) => (
                <li key={r.id}>{r.name}</li>
              ))}
            </ul>
          </div>
        ),
      })
    }

    if (reposWithLowQuality.length > 0) {
      cards.push({
        icon: 'trophy',
        title: 'Qualidade baixa',
        tone: T.warn,
        description: (
          <div>
            <div>{reposWithLowQuality.length} repositórios abaixo de 70/100</div>
            <ul style={{ margin: '4px 0 0 0', paddingLeft: 16, fontSize: 11.5 }}>
              {reposWithLowQuality.slice(0, 3).map((r) => (
                <li key={r.id}>{r.name}</li>
              ))}
            </ul>
          </div>
        ),
      })
    }

    if (reposWithoutAnalysis.length > 0) {
      cards.push({
        icon: 'database',
        title: 'Repos sem análise',
        tone: T.warn,
        description: `${reposWithoutAnalysis.length} repositório${reposWithoutAnalysis.length !== 1 ? 's' : ''} ainda sem score de qualidade.`,
      })
    }

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
          {cards.length + (searchInsight ? 1 : 0)} insight{cards.length + (searchInsight ? 1 : 0) !== 1 ? 's' : ''}
        </div>

        {searchInsight && <SearchSynthesisCard repoId={focusedRepo?.id} insight={searchInsight} />}

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
