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
import { RepositoryOwnerSection } from '@/components/repository/RepositoryOwnerSection'

interface RepositorySettingsClientProps {
  repo: RepositoryResponse
  orgConfig: OrganizationConfigResponse | null
  canManageCoverageTokens: boolean
  canAssignOwner: boolean
}

export function RepositorySettingsClient({
  repo,
  orgConfig,
  canManageCoverageTokens,
  canAssignOwner,
}: RepositorySettingsClientProps) {

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
          <RepositoryOwnerSection repo={repo} canAssign={canAssignOwner} />
        </section>

        <section style={sectionStyle}>
          <CoverageTokensSection repo={repo} canManage={canManageCoverageTokens} />
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
