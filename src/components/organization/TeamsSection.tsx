'use client'

import { CSSProperties, useCallback, useEffect, useState } from 'react'
import { T } from '@/lib/tokens'
import { apiFetch } from '@/lib/api/client'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Tag } from '@/components/ui/Tag'
import { Avatar } from '@/components/ui/Avatar'
import { MFIcon } from '@/components/icons/MFIcon'
import { Team, TeamListResponse, TeamMember, TeamMemberListResponse } from '@/lib/types/teams'
import { MemberListResponse, OrganizationMember } from '@/lib/types/organization-members'

export function TeamsSection() {
  const [teams, setTeams] = useState<Team[] | null>(null)
  const [orgMembers, setOrgMembers] = useState<OrganizationMember[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [members, setMembers] = useState<Record<string, TeamMember[]>>({})
  const [newTeam, setNewTeam] = useState('')
  const [creating, setCreating] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const [t, m] = await Promise.all([
        apiFetch<TeamListResponse>('/api/teams'),
        apiFetch<MemberListResponse>('/api/organizations/members'),
      ])
      setTeams(t.items ?? [])
      setOrgMembers(m.items ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar times.')
      setTeams([])
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const loadMembers = async (teamID: string) => {
    if (members[teamID]) return
    try {
      const res = await apiFetch<TeamMemberListResponse>(`/api/teams/${teamID}/members`)
      setMembers((prev) => ({ ...prev, [teamID]: res.items ?? [] }))
    } catch {
      setMembers((prev) => ({ ...prev, [teamID]: [] }))
    }
  }

  const toggle = async (teamID: string) => {
    const next = expanded === teamID ? null : teamID
    setExpanded(next)
    if (next) await loadMembers(next)
  }

  const createTeam = async () => {
    if (!newTeam.trim()) return
    setError(null)
    setCreating(true)
    try {
      const team = await apiFetch<Team>('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTeam.trim() }),
      })
      setTeams((prev) => [...(prev ?? []), team].sort((a, b) => a.name.localeCompare(b.name)))
      setNewTeam('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar o time.')
    } finally {
      setCreating(false)
    }
  }

  const deleteTeam = async (team: Team) => {
    const owned = team.repository_count
    const warning = owned > 0 ? `\n\n${owned} repositório(s) ficarão sem dono.` : ''
    if (!confirm(`Excluir o time "${team.name}"?${warning}`)) return
    setError(null)
    setBusy(team.id)
    try {
      await apiFetch(`/api/teams/${team.id}`, { method: 'DELETE' })
      setTeams((prev) => (prev ?? []).filter((t) => t.id !== team.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível excluir o time.')
    } finally {
      setBusy(null)
    }
  }

  const addMember = async (teamID: string, userID: string) => {
    if (!userID) return
    setError(null)
    setBusy(teamID)
    try {
      await apiFetch(`/api/teams/${teamID}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userID }),
      })
      const added = orgMembers.find((m) => m.user_id === userID)
      if (added) {
        setMembers((prev) => ({
          ...prev,
          [teamID]: [
            ...(prev[teamID] ?? []),
            { user_id: added.user_id, email: added.email, full_name: added.full_name, role: 'member' },
          ],
        }))
        setTeams((prev) =>
          (prev ?? []).map((t) => (t.id === teamID ? { ...t, member_count: t.member_count + 1 } : t))
        )
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível adicionar ao time.')
    } finally {
      setBusy(null)
    }
  }

  const removeMember = async (teamID: string, userID: string) => {
    setError(null)
    setBusy(teamID)
    try {
      await apiFetch(`/api/teams/${teamID}/members/${userID}`, { method: 'DELETE' })
      setMembers((prev) => ({ ...prev, [teamID]: (prev[teamID] ?? []).filter((m) => m.user_id !== userID) }))
      setTeams((prev) =>
        (prev ?? []).map((t) => (t.id === teamID ? { ...t, member_count: Math.max(0, t.member_count - 1) } : t))
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível remover do time.')
    } finally {
      setBusy(null)
    }
  }

  const cardStyle: CSSProperties = {
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.card,
    marginBottom: 10,
    overflow: 'hidden',
  }
  const headerRowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    background: T.surfaceAlt,
  }
  const selectStyle: CSSProperties = {
    padding: '5px 8px',
    borderRadius: T.radius.button,
    border: `1px solid ${T.border}`,
    background: T.surface,
    color: T.ink,
    fontSize: 12,
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <MFIcon name="folder" size={15} color={T.accent} />
        <span style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>Times</span>
      </div>

      <div style={{ fontSize: 12.5, color: T.ink3, lineHeight: 1.5, marginBottom: 14 }}>
        Um time é o dono responsável por um repositório. Quem está no time dono pode
        editar aquele repositório mesmo sendo <strong>developer</strong>; maintainers e
        admins editam qualquer um.
      </div>

      {error && (
        <div style={{ marginBottom: 12 }}>
          <Alert variant="danger">{error}</Alert>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <Input
            label="Novo time"
            value={newTeam}
            onChange={(event) => setNewTeam(event.target.value)}
            placeholder="Plataforma"
          />
        </div>
        <Button variant="primary" size="md" loading={creating} disabled={!newTeam.trim()} onClick={createTeam}>
          Criar
        </Button>
      </div>

      {teams === null ? (
        <div style={{ fontSize: 13, color: T.faint }}>Carregando times…</div>
      ) : teams.length === 0 ? (
        <div style={{ fontSize: 12.5, color: T.faint }}>
          Nenhum time ainda. Crie o primeiro para poder atribuir donos aos repositórios.
        </div>
      ) : (
        teams.map((team) => (
          <div key={team.id} style={cardStyle}>
            <div style={headerRowStyle}>
              <button
                type="button"
                onClick={() => toggle(team.id)}
                aria-expanded={expanded === team.id}
                style={{
                  appearance: 'none',
                  border: 0,
                  background: 'transparent',
                  cursor: 'pointer',
                  color: T.ink,
                  fontWeight: 600,
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <MFIcon name={expanded === team.id ? 'chevron-down' : 'chevron-right'} size={11} color={T.ink3} />
                {team.name}
              </button>
              <Tag variant="default">{team.member_count} pessoa(s)</Tag>
              <Tag variant={team.repository_count > 0 ? 'ok' : 'default'}>
                {team.repository_count} repo(s)
              </Tag>
              {team.source !== 'local' && <Tag variant="warn">importado</Tag>}
              <div style={{ flex: 1 }} />
              <Button
                variant="default"
                size="sm"
                loading={busy === team.id}
                onClick={() => deleteTeam(team)}
              >
                Excluir
              </Button>
            </div>

            {expanded === team.id && (
              <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(members[team.id] ?? []).length === 0 ? (
                  <div style={{ fontSize: 12, color: T.faint }}>Ninguém neste time ainda.</div>
                ) : (
                  (members[team.id] ?? []).map((member) => (
                    <div key={member.user_id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar name={member.full_name || member.email} size={22} />
                      <span style={{ fontSize: 12.5, color: T.ink }}>{member.full_name || member.email}</span>
                      {member.role === 'lead' && <Tag variant="accent">lead</Tag>}
                      <div style={{ flex: 1 }} />
                      <Button variant="default" size="sm" onClick={() => removeMember(team.id, member.user_id)}>
                        Remover
                      </Button>
                    </div>
                  ))
                )}

                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                  <select
                    aria-label={`Adicionar pessoa ao time ${team.name}`}
                    style={selectStyle}
                    defaultValue=""
                    onChange={(event) => {
                      void addMember(team.id, event.target.value)
                      event.target.value = ''
                    }}
                  >
                    <option value="">Adicionar pessoa…</option>
                    {orgMembers
                      .filter((m) => !(members[team.id] ?? []).some((tm) => tm.user_id === m.user_id))
                      .map((m) => (
                        <option key={m.user_id} value={m.user_id}>
                          {m.full_name || m.email}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}
