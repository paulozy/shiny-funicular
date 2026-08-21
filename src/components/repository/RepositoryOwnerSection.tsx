'use client'

import { CSSProperties, useEffect, useState } from 'react'
import { T } from '@/lib/tokens'
import { apiFetch } from '@/lib/api/client'
import { Alert } from '@/components/ui/Alert'
import { MFIcon } from '@/components/icons/MFIcon'
import { Team, TeamListResponse } from '@/lib/types/teams'
import { RepositoryResponse } from '@/lib/types/repository'

interface RepositoryOwnerSectionProps {
  repo: RepositoryResponse
  /** Assigning an owner is a maintainer action; others see it read-only. */
  canAssign: boolean
}

export function RepositoryOwnerSection({ repo, canAssign }: RepositoryOwnerSectionProps) {
  const [teams, setTeams] = useState<Team[] | null>(null)
  const [ownerID, setOwnerID] = useState(repo.owner_team?.id ?? '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await apiFetch<TeamListResponse>('/api/teams')
        if (!cancelled) setTeams(res.items ?? [])
      } catch {
        if (!cancelled) setTeams([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const assign = async (teamID: string) => {
    setError(null)
    setMessage(null)
    setSaving(true)
    try {
      await apiFetch(`/api/repositories/${repo.id}/owner`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        // An empty selection clears the owner; "unowned" is a real state.
        body: JSON.stringify({ team_id: teamID || null }),
      })
      setOwnerID(teamID)
      setMessage(teamID ? 'Time responsável atualizado.' : 'Repositório marcado como sem dono.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível alterar o dono.')
    } finally {
      setSaving(false)
    }
  }

  const selectStyle: CSSProperties = {
    width: '100%',
    maxWidth: 320,
    padding: '8px 10px',
    borderRadius: T.radius.button,
    border: `1px solid ${T.border}`,
    background: T.surface,
    color: T.ink,
    fontSize: 13,
  }

  const current = teams?.find((t) => t.id === ownerID)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <MFIcon name="user" size={15} color={T.accent} />
        <span style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>Time responsável</span>
      </div>

      <div style={{ fontSize: 12.5, color: T.ink3, lineHeight: 1.5, marginBottom: 12 }}>
        Quem chamar quando este serviço quebrar. Quem está no time responsável pode editar
        este repositório mesmo sendo developer.
      </div>

      {error && (
        <div style={{ marginBottom: 10 }}>
          <Alert variant="danger">{error}</Alert>
        </div>
      )}
      {message && (
        <div style={{ marginBottom: 10 }}>
          <Alert variant="ok">{message}</Alert>
        </div>
      )}

      {!canAssign ? (
        <div style={{ fontSize: 13, color: T.ink }}>
          {current ? current.name : repo.owner_team?.name ?? 'Sem dono definido'}
        </div>
      ) : teams === null ? (
        <div style={{ fontSize: 13, color: T.faint }}>Carregando times…</div>
      ) : teams.length === 0 ? (
        <div style={{ fontSize: 12.5, color: T.faint }}>
          Nenhum time criado ainda. Crie um em Configurações → Times para poder atribuir
          um responsável.
        </div>
      ) : (
        <select
          aria-label="Time responsável"
          style={selectStyle}
          value={ownerID}
          disabled={saving}
          onChange={(event) => assign(event.target.value)}
        >
          <option value="">Sem dono</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
