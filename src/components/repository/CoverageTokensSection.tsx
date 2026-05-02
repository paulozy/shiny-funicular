'use client'

import { CSSProperties, useEffect, useState } from 'react'
import { T } from '@/lib/tokens'
import { apiFetch } from '@/lib/api/client'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Tag } from '@/components/ui/Tag'
import { MFIcon } from '@/components/icons/MFIcon'
import { CoverageToken, CoverageTokenWithSecret } from '@/lib/types/coverage'
import { RepositoryResponse } from '@/lib/types/repository'
import { copyText } from '@/lib/clipboard'
import { NewCoverageTokenModal } from './NewCoverageTokenModal'
import { CoverageTokenCreatedModal } from './CoverageTokenCreatedModal'

interface CoverageTokensSectionProps {
  repo: RepositoryResponse
  canManage: boolean
}

const apiBaseEnvName = 'IDP_BASE_URL'

function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString()
  } catch {
    return value
  }
}

export function CoverageTokensSection({ repo, canManage }: CoverageTokensSectionProps) {
  const [tokens, setTokens] = useState<CoverageToken[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [createdToken, setCreatedToken] = useState<CoverageTokenWithSecret | null>(null)
  const [revoking, setRevoking] = useState<string | null>(null)
  const [copiedRepoID, setCopiedRepoID] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const list = await apiFetch<CoverageToken[]>(
          `/api/repositories/${repo.id}/coverage/tokens`
        )
        if (!cancelled) {
          setTokens(Array.isArray(list) ? list : [])
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Erro ao listar tokens.')
          setTokens([])
        }
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [repo.id])

  const handleCreated = (token: CoverageTokenWithSecret) => {
    // Update list, close create modal, open created modal with plaintext.
    setTokens((prev) => [
      { id: token.id, name: token.name, expires_at: token.expires_at, created_at: token.created_at },
      ...(prev ?? []),
    ])
    setCreateOpen(false)
    setCreatedToken(token)
  }

  const handleRevoke = async (id: string) => {
    if (!canManage) return
    if (!confirm('Revogar este token? Quaisquer uploads em CI usando ele falharão.')) {
      return
    }
    setRevoking(id)
    try {
      await apiFetch(`/api/repositories/${repo.id}/coverage/tokens/${id}`, { method: 'DELETE' })
      const now = new Date().toISOString()
      setTokens((prev) =>
        (prev ?? []).map((t) => (t.id === id ? { ...t, revoked_at: now } : t))
      )
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível revogar.')
    } finally {
      setRevoking(null)
    }
  }

  const handleCopyRepoID = async () => {
    if (await copyText(repo.id)) {
      setCopiedRepoID(true)
      window.setTimeout(() => setCopiedRepoID(false), 1200)
    }
  }

  const sectionStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  }
  const headerRow: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    justifyContent: 'space-between',
  }
  const titleStyle: CSSProperties = { fontSize: 13, fontWeight: 600 }
  const subtitleStyle: CSSProperties = { fontSize: 12, color: T.ink2, margin: 0 }
  const idBoxStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: T.surfaceAlt,
    border: `1px solid ${T.border}`,
    borderRadius: 8,
    padding: '6px 10px',
  }
  const idCodeStyle: CSSProperties = {
    fontFamily: T.mono,
    fontSize: 11,
    flex: 1,
    overflow: 'auto',
    whiteSpace: 'nowrap',
    color: T.ink,
  }
  const tableStyle: CSSProperties = {
    border: `1px solid ${T.border}`,
    borderRadius: 8,
    overflow: 'hidden',
  }
  const rowStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 130px 130px 110px',
    alignItems: 'center',
    padding: '10px 12px',
    fontSize: 12,
    gap: 8,
    borderBottom: `1px solid ${T.border}`,
  }
  const headRowStyle: CSSProperties = {
    ...rowStyle,
    background: T.surfaceAlt,
    fontWeight: 600,
    color: T.ink2,
  }

  const visibleTokens = tokens ?? []

  return (
    <section style={sectionStyle} aria-label="Cobertura de testes">
      <div style={headerRow}>
        <div>
          <div style={titleStyle}>Cobertura de testes (CI)</div>
          <p style={subtitleStyle}>
            Tokens de upload usados pelo seu CI para enviar relatórios via{' '}
            <code style={{ fontFamily: T.mono, fontSize: 11 }}>POST /coverage</code>.
          </p>
        </div>
        {canManage && (
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            <MFIcon name="plus" size={12} /> Novo token
          </Button>
        )}
      </div>

      <div>
        <p style={{ ...subtitleStyle, marginBottom: 4 }}>
          ID do repositório (use como{' '}
          <code style={{ fontFamily: T.mono, fontSize: 11 }}>IDP_REPOSITORY_ID</code> no CI):
        </p>
        <div style={idBoxStyle}>
          <code style={idCodeStyle}>{repo.id}</code>
          <Button variant="default" onClick={handleCopyRepoID}>
            {copiedRepoID ? 'Copiado' : 'Copiar'}
          </Button>
        </div>
        <p style={{ ...subtitleStyle, marginTop: 6 }}>
          Configure também os secrets{' '}
          <code style={{ fontFamily: T.mono, fontSize: 11 }}>{apiBaseEnvName}</code> e{' '}
          <code style={{ fontFamily: T.mono, fontSize: 11 }}>IDP_COVERAGE_TOKEN</code> no
          seu CI.
        </p>
      </div>

      {loadError && <Alert variant="danger">{loadError}</Alert>}

      {tokens === null ? (
        <p style={{ fontSize: 12, color: T.ink2 }}>Carregando tokens…</p>
      ) : visibleTokens.length === 0 ? (
        <Alert variant="warn">
          Ainda não há tokens criados. Gere um para integrar seu CI.
        </Alert>
      ) : (
        <div style={tableStyle} role="table">
          <div style={headRowStyle} role="row">
            <div role="columnheader">Nome</div>
            <div role="columnheader">Último uso</div>
            <div role="columnheader">Expira em</div>
            <div role="columnheader" style={{ textAlign: 'right' }}>
              Status
            </div>
          </div>
          {visibleTokens.map((t) => {
            const isRevoked = !!t.revoked_at
            return (
              <div
                key={t.id}
                role="row"
                style={{
                  ...rowStyle,
                  borderBottom: 0,
                  opacity: isRevoked ? 0.55 : 1,
                }}
              >
                <div role="cell" style={{ fontWeight: 500 }}>
                  {t.name}
                </div>
                <div role="cell" style={{ color: T.ink2 }}>
                  {formatDate(t.last_used_at)}
                </div>
                <div role="cell" style={{ color: T.ink2 }}>
                  {formatDate(t.expires_at)}
                </div>
                <div role="cell" style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                  {isRevoked ? (
                    <Tag variant="danger">Revogado</Tag>
                  ) : (
                    <Tag variant="ok">Ativo</Tag>
                  )}
                  {canManage && !isRevoked && (
                    <Button
                      variant="default"
                      onClick={() => handleRevoke(t.id)}
                      loading={revoking === t.id}
                    >
                      Revogar
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {canManage && (
        <NewCoverageTokenModal
          isOpen={createOpen}
          repoID={repo.id}
          onClose={() => setCreateOpen(false)}
          onCreated={handleCreated}
        />
      )}
      <CoverageTokenCreatedModal
        token={createdToken}
        repoID={repo.id}
        onClose={() => setCreatedToken(null)}
      />
    </section>
  )
}
