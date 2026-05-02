'use client'

import { CSSProperties, useState } from 'react'
import Link from 'next/link'
import { T } from '@/lib/tokens'
import { apiFetch } from '@/lib/api/client'
import { OrganizationConfigResponse } from '@/lib/types/organization'
import { RepositoryResponse } from '@/lib/types/repository'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { Tag } from '@/components/ui/Tag'
import { MFIcon } from '@/components/icons/MFIcon'
import { CoverageTokensSection } from '@/components/repository/CoverageTokensSection'

interface RepositorySettingsClientProps {
  repo: RepositoryResponse
  orgConfig: OrganizationConfigResponse | null
  canConfigureOrganization: boolean
}

type IndexState = 'idle' | 'queued' | 'in_progress' | 'unavailable' | 'forbidden' | 'error'

function statusMessage(state: IndexState): { variant: 'ok' | 'warn' | 'danger'; text: string } | null {
  switch (state) {
    case 'queued':
      return { variant: 'ok', text: 'Indexação na fila. Tente buscar novamente quando o processamento terminar.' }
    case 'in_progress':
      return { variant: 'warn', text: 'Já existe uma indexação em andamento para este repositório e branch.' }
    case 'unavailable':
      return { variant: 'warn', text: 'Provider de embeddings não configurado. Configure a Voyage API key nas configurações da organização.' }
    case 'forbidden':
      return { variant: 'danger', text: 'Você não tem permissão para gerar este índice.' }
    case 'error':
      return { variant: 'danger', text: 'Não foi possível gerar o índice. Tente novamente em alguns instantes.' }
    default:
      return null
  }
}

export function RepositorySettingsClient({
  repo,
  orgConfig,
  canConfigureOrganization,
}: RepositorySettingsClientProps) {
  const [branch, setBranch] = useState(repo.metadata?.default_branch || 'main')
  const [indexState, setIndexState] = useState<IndexState>('idle')
  const [loading, setLoading] = useState(false)
  const providerStatusKnown = orgConfig !== null
  const providerConfigured = orgConfig?.voyage_api_key_configured ?? false
  const message = statusMessage(indexState)

  const generateEmbeddings = async () => {
    setLoading(true)
    setIndexState('idle')

    try {
      await apiFetch(`/api/repositories/${repo.id}/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branch: branch.trim() || undefined }),
      })
      setIndexState('queued')
    } catch (err) {
      const code = (err as any).code || 'server_error'
      if (code === 'embeddings_in_progress') {
        setIndexState('in_progress')
      } else if (code === 'embeddings_unavailable') {
        setIndexState('unavailable')
      } else if (code === 'forbidden' || code === 'unauthorized' || code === 'authentication_failed') {
        setIndexState('forbidden')
      } else {
        setIndexState('error')
      }
    } finally {
      setLoading(false)
    }
  }

  const pageStyle: CSSProperties = {
    padding: '20px 24px 28px',
  }

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 14,
    marginBottom: 18,
  }

  const eyebrowStyle: CSSProperties = {
    fontSize: 10.5,
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: T.faint,
    marginBottom: 4,
  }

  const titleStyle: CSSProperties = {
    margin: 0,
    fontSize: 22,
    fontWeight: 600,
    color: T.ink,
  }

  const layoutStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 280px',
    gap: 14,
    alignItems: 'start',
  }

  const sectionStyle: CSSProperties = {
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.card,
    padding: 16,
  }

  const sectionHeaderStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  }

  const sectionTitleStyle: CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
  }

  const statusRowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 12,
  }

  const descriptionStyle: CSSProperties = {
    fontSize: 12.5,
    color: T.ink3,
    lineHeight: 1.5,
    marginBottom: 14,
  }

  const metaGridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: 8,
    fontSize: 12.5,
  }

  const metaRowStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    borderBottom: `1px solid ${T.border}`,
    paddingBottom: 8,
  }

  const linkStyle: CSSProperties = {
    color: T.accent,
    fontSize: 12.5,
    fontWeight: 500,
    textDecoration: 'none',
  }

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <div style={eyebrowStyle}>{repo.full_name}</div>
          <h1 style={titleStyle}>Configurações do repositório</h1>
        </div>
      </div>

      <div style={layoutStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <MFIcon name="search" size={15} color={T.ok} />
            <span style={sectionTitleStyle}>Busca semântica</span>
          </div>

          <div style={statusRowStyle}>
            <Tag variant={!providerStatusKnown ? 'default' : providerConfigured ? 'ok' : 'warn'}>
              Voyage {!providerStatusKnown ? 'configurado pela organização' : providerConfigured ? 'configurado' : 'pendente'}
            </Tag>
            <Tag variant="default">{orgConfig?.embeddings_model || 'voyage-code-3'}</Tag>
            <Tag variant="default">{orgConfig?.embeddings_dimensions || 1024} dimensões</Tag>
          </div>

          <div style={descriptionStyle}>
            Gere o índice semântico para a branch escolhida. A configuração de provider e chave fica nas configurações da organização.
          </div>

          {message && <Alert variant={message.variant}>{message.text}</Alert>}

          {providerStatusKnown && !providerConfigured && canConfigureOrganization && (
            <Alert variant="warn">
              Configure a Voyage API key em <Link href="/settings" style={linkStyle}>Configurações</Link> antes de gerar o índice.
            </Alert>
          )}

          <Input
            label="Branch"
            value={branch}
            onChange={(event) => setBranch(event.target.value)}
            placeholder="main"
            hint="A indexação substitui os embeddings anteriores para o mesmo repositório, provider, modelo, dimensão e branch."
          />

          <Button
            variant="primary"
            size="md"
            loading={loading}
            onClick={generateEmbeddings}
            disabled={loading || !branch.trim()}
          >
            <MFIcon name="database" size={13} />
            Gerar índice semântico
          </Button>
        </section>

        <section style={sectionStyle}>
          <CoverageTokensSection repo={repo} canManage={canConfigureOrganization} />
        </section>
        </div>

        <aside style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <MFIcon name="folder" size={15} color={T.accent} />
            <span style={sectionTitleStyle}>Repositório</span>
          </div>
          <div style={metaGridStyle}>
            <div style={metaRowStyle}>
              <span style={{ color: T.faint }}>Provider</span>
              <span>{repo.provider}</span>
            </div>
            <div style={metaRowStyle}>
              <span style={{ color: T.faint }}>Branch padrão</span>
              <span style={{ fontFamily: T.mono }}>{repo.metadata?.default_branch || 'main'}</span>
            </div>
            <div style={metaRowStyle}>
              <span style={{ color: T.faint }}>Visibilidade</span>
              <span>{repo.is_private ? 'Privado' : 'Público'}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
