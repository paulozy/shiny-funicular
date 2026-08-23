'use client'

import { CSSProperties, useCallback, useEffect, useState } from 'react'
import { T } from '@/lib/tokens'
import { apiFetch } from '@/lib/api/client'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Tag } from '@/components/ui/Tag'
import { useToast } from '@/components/ui/Toast'
import { TeamEditModal } from '@/components/organization/TeamEditModal'
import { Team, TeamListResponse } from '@/lib/types/teams'
import { MemberListResponse, OrganizationMember } from '@/lib/types/organization-members'
import { RepositoryListResponse, RepositoryResponse } from '@/lib/types/repository'

/**
 * Teams settings: create, rename, delete, and open the editor where a team's
 * people and repositories are managed.
 *
 * The catalog is loaded here rather than inside the modal because the list
 * needs it too — a team's repository count is derived from who owns what, and
 * loading it once keeps the two views from disagreeing.
 */
export function TeamsSection() {
  const { toast } = useToast()
  const [teams, setTeams] = useState<Team[] | null>(null)
  const [orgMembers, setOrgMembers] = useState<OrganizationMember[]>([])
  const [repositories, setRepositories] = useState<RepositoryResponse[]>([])
  const [newTeam, setNewTeam] = useState('')
  const [creating, setCreating] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Team | null>(null)

  const load = useCallback(async () => {
    try {
      const [teamList, memberList, repoList] = await Promise.all([
        apiFetch<TeamListResponse>('/api/teams'),
        apiFetch<MemberListResponse>('/api/organizations/members'),
        // Explicit limit: the route defaults to 20, and a truncated catalog
        // would silently under-report how many repositories a team owns and
        // hide the rest from the "assign a repository" picker. 100 is what the
        // repository scope already uses for the same lookup.
        apiFetch<RepositoryListResponse>('/api/repositories?limit=100'),
      ])
      setTeams(teamList.items ?? [])
      setOrgMembers(memberList.items ?? [])
      setRepositories(repoList.repositories ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar times.')
      setTeams([])
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const createTeam = async () => {
    const name = newTeam.trim()
    if (!name) return
    setError(null)
    setCreating(true)
    try {
      const team = await apiFetch<Team>('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      setTeams((prev) => [...(prev ?? []), team].sort((a, b) => a.name.localeCompare(b.name)))
      setNewTeam('')
      toast(`Time ${name} criado`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar o time.')
    } finally {
      setCreating(false)
    }
  }

  const deleteTeam = async (team: Team) => {
    const owned = repositoriesOf(repositories, team).length
    const warning = owned > 0 ? `\n\n${owned} repositório(s) ficarão sem dono.` : ''
    if (!confirm(`Excluir o time "${team.name}"?${warning}`)) return
    setError(null)
    setBusy(team.id)
    try {
      await apiFetch(`/api/teams/${team.id}`, { method: 'DELETE' })
      setTeams((prev) => (prev ?? []).filter((t) => t.id !== team.id))
      await load()
      toast(`Time ${team.name} removido`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível excluir o time.')
    } finally {
      setBusy(null)
    }
  }

  // The team held in `editing` can go stale after a refresh; resolve it against
  // the freshly-loaded list so the modal title follows a rename.
  const editingTeam = editing ? (teams ?? []).find((t) => t.id === editing.id) ?? editing : null

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <h2 style={{ fontSize: 18, margin: 0 }}>Times</h2>
        {teams && <Tag>{teams.length}</Tag>}
      </div>
      <p style={{ fontSize: 13.5, color: T.ink3, margin: '0 0 18px', lineHeight: 1.55 }}>
        Times respondem por repositórios. Repositórios sem time aparecem como pendência na home.
      </p>

      {error && (
        <div style={{ marginBottom: 12 }}>
          <Alert variant="danger">{error}</Alert>
        </div>
      )}

      <div style={createRowStyle}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <Input
            label="Novo time"
            value={newTeam}
            onChange={(event) => setNewTeam(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void createTeam()
            }}
            placeholder="ex: Plataforma"
          />
        </div>
        <Button
          variant="primary"
          size="md"
          loading={creating}
          disabled={!newTeam.trim()}
          onClick={createTeam}
        >
          Criar time
        </Button>
      </div>

      {teams === null ? (
        <p style={{ fontSize: 13, color: T.faint }}>Carregando times…</p>
      ) : teams.length === 0 ? (
        <p style={{ fontSize: 12.5, color: T.faint }}>
          Nenhum time ainda. Crie o primeiro para poder atribuir donos aos repositórios.
        </p>
      ) : (
        teams.map((team) => (
          <div key={team.id} style={teamRowStyle}>
            <span style={{ fontSize: 14, fontWeight: 600, minWidth: 160 }}>{team.name}</span>
            <span style={{ fontSize: 12.5, color: T.neutral600 }}>
              {metaFor(team, repositories)}
            </span>
            {team.source !== 'local' && <Tag variant="warn">importado</Tag>}
            <span style={{ flex: 1 }} />
            <Button variant="default" size="sm" onClick={() => setEditing(team)}>
              Editar time
            </Button>
            <button
              type="button"
              onClick={() => void deleteTeam(team)}
              disabled={busy === team.id}
              style={removeStyle}
            >
              Remover
            </button>
          </div>
        ))
      )}

      <TeamEditModal
        team={editingTeam}
        orgMembers={orgMembers}
        repositories={repositories}
        onClose={() => setEditing(null)}
        // The modal writes through the API; re-reading here keeps the counters,
        // the ownership and the open editor in agreement afterwards.
        onChanged={() => void load()}
      />
    </div>
  )
}

/** A team's repositories are the ones whose owner is that team. */
function repositoriesOf(repositories: RepositoryResponse[], team: Team): RepositoryResponse[] {
  return repositories.filter((repo) => repo.owner_team?.id === team.id)
}

function metaFor(team: Team, repositories: RepositoryResponse[]): string {
  const people = team.member_count === 1 ? '1 pessoa' : `${team.member_count} pessoas`
  const owned = repositoriesOf(repositories, team).length
  const repos = owned === 1 ? '1 repositório' : `${owned} repositórios`
  return `${people} · ${repos}`
}

const createRowStyle: CSSProperties = {
  display: 'flex',
  gap: 8,
  alignItems: 'flex-end',
  marginBottom: 18,
  flexWrap: 'wrap',
}

const teamRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '12px 0',
  borderTop: `1px solid ${T.neutral200}`,
  flexWrap: 'wrap',
}

const removeStyle: CSSProperties = {
  font: 'inherit',
  fontSize: 13,
  background: 'none',
  border: 0,
  cursor: 'pointer',
  color: T.danger,
}
