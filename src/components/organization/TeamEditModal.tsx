'use client'

import { CSSProperties, useCallback, useEffect, useState } from 'react'
import { T } from '@/lib/tokens'
import { apiFetch } from '@/lib/api/client'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Tag } from '@/components/ui/Tag'
import { useToast } from '@/components/ui/Toast'
import { Team, TeamMember, TeamMemberListResponse } from '@/lib/types/teams'
import { OrganizationMember } from '@/lib/types/organization-members'
import { RepositoryResponse } from '@/lib/types/repository'

interface TeamEditModalProps {
  team: Team | null
  /** Everyone in the organization, for the "add a person" picker. */
  orgMembers: OrganizationMember[]
  /** The whole catalog: a team's repositories are the ones it owns. */
  repositories: RepositoryResponse[]
  onClose: () => void
  /**
   * Fired after any change that alters the counters the list shows, so the
   * parent can refresh without this component owning that state.
   */
  onChanged: () => void
}

/**
 * "Editar time": the one place where a team's name, its people and the
 * repositories it answers for are all editable together.
 *
 * Repository ownership is written through the repository, not the team —
 * `PUT /repositories/:id/owner` — because a repository has a single owning
 * team. Attaching one here is the same call the repository's own settings page
 * makes, from the other direction.
 */
export function TeamEditModal({
  team,
  orgMembers,
  repositories,
  onClose,
  onChanged,
}: TeamEditModalProps) {
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [members, setMembers] = useState<TeamMember[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const teamID = team?.id ?? null

  useEffect(() => {
    setName(team?.name ?? '')
    setError(null)
    setMembers(null)
  }, [team])

  const loadMembers = useCallback(async () => {
    if (!teamID) return
    try {
      const res = await apiFetch<TeamMemberListResponse>(`/api/teams/${teamID}/members`)
      setMembers(res.items ?? [])
    } catch {
      setMembers([])
    }
  }, [teamID])

  useEffect(() => {
    void loadMembers()
  }, [loadMembers])

  // Escape closes, as in every other dialog in the app.
  useEffect(() => {
    if (!team) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [team, onClose])

  if (!team) return null

  const owned = repositories.filter((repo) => repo.owner_team?.id === team.id)
  const available = repositories.filter((repo) => repo.owner_team?.id !== team.id)
  const memberList = members ?? []
  const candidates = orgMembers.filter(
    (person) => !memberList.some((member) => member.user_id === person.user_id)
  )

  async function run(action: () => Promise<void>, failure: string) {
    setError(null)
    setBusy(true)
    try {
      await action()
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : failure)
    } finally {
      setBusy(false)
    }
  }

  async function rename() {
    const trimmed = name.trim()
    if (!trimmed || trimmed === team?.name) return
    await run(async () => {
      await apiFetch(`/api/teams/${team!.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      })
      toast(`Time renomeado para ${trimmed}`)
    }, 'Não foi possível renomear o time.')
  }

  async function addPerson(userID: string) {
    if (!userID) return
    await run(async () => {
      await apiFetch(`/api/teams/${team!.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userID }),
      })
      await loadMembers()
      toast('Pessoa adicionada ao time')
    }, 'Não foi possível adicionar ao time.')
  }

  async function removePerson(member: TeamMember) {
    await run(async () => {
      await apiFetch(`/api/teams/${team!.id}/members/${member.user_id}`, { method: 'DELETE' })
      await loadMembers()
      toast('Pessoa removida do time')
    }, 'Não foi possível remover do time.')
  }

  async function attachRepo(repoID: string) {
    if (!repoID) return
    await run(async () => {
      await apiFetch(`/api/repositories/${repoID}/owner`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team_id: team!.id }),
      })
      toast('Repositório atribuído ao time')
    }, 'Não foi possível atribuir o repositório.')
  }

  async function detachRepo(repo: RepositoryResponse) {
    await run(async () => {
      // null clears the owner — "unowned" is a real state, not a failure.
      await apiFetch(`/api/repositories/${repo.id}/owner`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team_id: null }),
      })
      toast(`${repo.name} ficou sem time responsável`)
    }, 'Não foi possível remover o repositório do time.')
  }

  return (
    <div style={overlayStyle} onClick={onClose} role="presentation">
      <div
        style={cardStyle}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Editar time ${team.name}`}
      >
        <div style={headerStyle}>
          <h2 style={{ fontSize: 16, margin: 0 }}>Editar time</h2>
          <span style={{ flex: 1 }} />
          <button type="button" aria-label="Fechar" onClick={onClose} style={closeStyle}>
            ✕
          </button>
        </div>

        <div style={bodyStyle}>
          {error && <Alert variant="danger">{error}</Alert>}

          <Input
            label="Nome do time"
            value={name}
            onChange={(event) => setName(event.target.value)}
            onBlur={() => void rename()}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void rename()
            }}
            hint="A alteração é salva ao sair do campo."
          />

          <section>
            <div style={sectionHeadStyle}>
              <h3 style={{ fontSize: 14, margin: 0 }}>Pessoas</h3>
              <Tag>{memberList.length}</Tag>
            </div>

            <div style={rowsStyle}>
              {members === null ? (
                <p style={emptyStyle}>Carregando…</p>
              ) : memberList.length === 0 ? (
                <p style={emptyStyle}>Ninguém neste time ainda.</p>
              ) : (
                memberList.map((member) => (
                  <div key={member.user_id} style={rowStyle}>
                    <span style={{ fontSize: 13.5, fontWeight: 600 }}>
                      {member.full_name || member.email}
                    </span>
                    {member.full_name && (
                      <span style={{ fontSize: 12.5, color: T.neutral600 }}>{member.email}</span>
                    )}
                    <span style={{ flex: 1 }} />
                    <Tag>{member.role}</Tag>
                    <button
                      type="button"
                      onClick={() => void removePerson(member)}
                      disabled={busy}
                      style={removeStyle}
                    >
                      Remover
                    </button>
                  </div>
                ))
              )}
            </div>

            <select
              aria-label="Adicionar pessoa ao time"
              style={{ ...selectStyle, maxWidth: 280 }}
              value=""
              disabled={busy || candidates.length === 0}
              onChange={(event) => void addPerson(event.target.value)}
            >
              <option value="">
                {candidates.length === 0 ? 'Todos já estão no time' : 'Adicionar pessoa…'}
              </option>
              {candidates.map((person) => (
                <option key={person.user_id} value={person.user_id}>
                  {person.full_name || person.email}
                </option>
              ))}
            </select>
          </section>

          <section>
            <div style={sectionHeadStyle}>
              <h3 style={{ fontSize: 14, margin: 0 }}>Repositórios do time</h3>
              <Tag>{owned.length}</Tag>
            </div>

            <div style={rowsStyle}>
              {owned.length === 0 ? (
                <p style={emptyStyle}>Este time ainda não responde por nenhum repositório.</p>
              ) : (
                owned.map((repo) => (
                  <div key={repo.id} style={rowStyle}>
                    <span style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 600 }}>
                      {repo.name}
                    </span>
                    {repo.description && (
                      <span style={{ fontSize: 12.5, color: T.neutral600 }}>{repo.description}</span>
                    )}
                    <span style={{ flex: 1 }} />
                    <button
                      type="button"
                      onClick={() => void detachRepo(repo)}
                      disabled={busy}
                      style={removeStyle}
                    >
                      Remover
                    </button>
                  </div>
                ))
              )}
            </div>

            <select
              aria-label="Atribuir repositório ao time"
              style={{ ...selectStyle, maxWidth: 320 }}
              value=""
              disabled={busy || available.length === 0}
              onChange={(event) => void attachRepo(event.target.value)}
            >
              <option value="">
                {available.length === 0 ? 'Nenhum repositório disponível' : 'Atribuir repositório…'}
              </option>
              {available.map((repo) => (
                <option key={repo.id} value={repo.id}>
                  {repo.name}
                  {repo.owner_team ? ` — hoje: ${repo.owner_team.name}` : ' — sem dono'}
                </option>
              ))}
            </select>

            <p style={{ fontSize: 12.5, color: T.neutral600, margin: '8px 0 0', lineHeight: 1.5 }}>
              Um repositório tem um único time dono. Quem está no time pode editá-lo mesmo sendo
              developer — atribuir um repositório já dono de outro time o transfere.
            </p>
          </section>
        </div>

        <div style={footerStyle}>
          <Button variant="primary" size="md" onClick={onClose}>
            Concluir
          </Button>
        </div>
      </div>
    </div>
  )
}

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 60,
  background: T.overlay,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
}

const cardStyle: CSSProperties = {
  width: '100%',
  maxWidth: 560,
  maxHeight: '85vh',
  overflow: 'auto',
  background: T.surface,
  borderRadius: T.radius.dialog,
  boxShadow: T.shadow,
  display: 'flex',
  flexDirection: 'column',
}

const headerStyle: CSSProperties = {
  padding: '16px 20px',
  borderBottom: `1px solid ${T.border}`,
  display: 'flex',
  alignItems: 'center',
  gap: 10,
}

const bodyStyle: CSSProperties = {
  padding: 20,
  display: 'flex',
  flexDirection: 'column',
  gap: 22,
}

const footerStyle: CSSProperties = {
  padding: '14px 20px',
  borderTop: `1px solid ${T.border}`,
  display: 'flex',
  justifyContent: 'flex-end',
}

const sectionHeadStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  marginBottom: 10,
}

const rowsStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  marginBottom: 10,
}

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flexWrap: 'wrap',
  background: T.bg,
  borderRadius: T.radius.tag,
  padding: '9px 12px',
}

const emptyStyle: CSSProperties = { fontSize: 12.5, color: T.neutral600, margin: 0 }

const removeStyle: CSSProperties = {
  font: 'inherit',
  fontSize: 12.5,
  background: 'none',
  border: 0,
  cursor: 'pointer',
  color: T.danger,
}

const selectStyle: CSSProperties = {
  font: 'inherit',
  fontSize: 13,
  minHeight: 36,
  padding: '7px 11px',
  width: '100%',
  background: T.surface,
  color: T.ink,
  border: `1px solid ${T.border}`,
  borderRadius: T.radius.input,
  cursor: 'pointer',
}

const closeStyle: CSSProperties = {
  font: 'inherit',
  background: 'none',
  border: 0,
  cursor: 'pointer',
  color: T.neutral600,
  fontSize: 16,
}
