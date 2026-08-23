'use client'

import { CSSProperties, useCallback, useEffect, useState } from 'react'
import { T } from '@/lib/tokens'
import { apiFetch } from '@/lib/api/client'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Tag } from '@/components/ui/Tag'
import { Avatar } from '@/components/ui/Avatar'
import { MFIcon } from '@/components/icons/MFIcon'
import { UserInfo, UserRole } from '@/lib/types/auth'
import {
  CreateInviteResult,
  InviteListResponse,
  MemberListResponse,
  OrganizationInvite,
  OrganizationMember,
} from '@/lib/types/organization-members'
import { NewInviteModal } from './NewInviteModal'
import { InviteCreatedModal } from './InviteCreatedModal'

interface MembersSectionProps {
  user: UserInfo
}

const ROLES: UserRole[] = ['viewer', 'developer', 'maintainer', 'admin']

const INVITE_STATUS_LABEL: Record<OrganizationInvite['status'], { label: string; variant: 'ok' | 'warn' | 'danger' | 'default' }> = {
  pending: { label: 'pendente', variant: 'warn' },
  accepted: { label: 'aceito', variant: 'ok' },
  revoked: { label: 'revogado', variant: 'default' },
  expired: { label: 'expirado', variant: 'danger' },
}

export function MembersSection({ user }: MembersSectionProps) {
  const [members, setMembers] = useState<OrganizationMember[] | null>(null)
  const [invites, setInvites] = useState<OrganizationInvite[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [created, setCreated] = useState<CreateInviteResult | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const [m, i] = await Promise.all([
        apiFetch<MemberListResponse>('/api/organizations/members'),
        apiFetch<InviteListResponse>('/api/organizations/invites'),
      ])
      setMembers(m.items ?? [])
      setInvites(i.items ?? [])
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Falha ao carregar membros.')
      setMembers([])
      setInvites([])
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      if (cancelled) return
      await load()
    })()
    return () => {
      cancelled = true
    }
  }, [load])

  const handleRoleChange = async (member: OrganizationMember, role: UserRole) => {
    setActionError(null)
    setBusy(member.user_id)
    try {
      await apiFetch(`/api/organizations/members/${member.user_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      setMembers((prev) =>
        prev ? prev.map((m) => (m.user_id === member.user_id ? { ...m, role } : m)) : prev
      )
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Não foi possível alterar o papel.')
    } finally {
      setBusy(null)
    }
  }

  const handleRemove = async (member: OrganizationMember) => {
    if (!confirm(`Remover ${member.full_name || member.email} da organização?`)) return
    setActionError(null)
    setBusy(member.user_id)
    try {
      await apiFetch(`/api/organizations/members/${member.user_id}`, { method: 'DELETE' })
      setMembers((prev) => (prev ? prev.filter((m) => m.user_id !== member.user_id) : prev))
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Não foi possível remover o membro.')
    } finally {
      setBusy(null)
    }
  }

  const handleRevoke = async (invite: OrganizationInvite) => {
    setActionError(null)
    setBusy(invite.id)
    try {
      await apiFetch(`/api/organizations/invites/${invite.id}`, { method: 'DELETE' })
      setInvites((prev) =>
        prev
          ? prev.map((i) =>
              i.id === invite.id ? { ...i, status: 'revoked', revoked_at: new Date().toISOString() } : i
            )
          : prev
      )
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Não foi possível revogar o convite.')
    } finally {
      setBusy(null)
    }
  }

  const memberRowStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 150px 120px',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    borderTop: `1px solid ${T.border}`,
    fontSize: 12.5,
  }
  const inviteRowStyle: CSSProperties = { ...memberRowStyle, gridTemplateColumns: '1fr 110px 120px' }
  const headStyle = (base: CSSProperties): CSSProperties => ({
    ...base,
    background: T.surfaceAlt,
    fontWeight: 600,
    borderTop: 'none',
    color: T.ink3,
  })
  const blockStyle: CSSProperties = {
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.card,
    overflow: 'hidden',
    marginBottom: 16,
  }
  const selectStyle: CSSProperties = {
    width: '100%',
    padding: '5px 8px',
    borderRadius: T.radius.button,
    border: `1px solid ${T.border}`,
    background: T.surface,
    color: T.ink,
    fontSize: 12,
  }

  const pendingInvites = (invites ?? []).filter((i) => i.status === 'pending')

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: T.ink, margin: 0 }}>Membros</h2>
        <div style={{ flex: 1 }} />
        <Button variant="primary" size="md" onClick={() => setInviteOpen(true)}>
          <MFIcon name="plus" size={11} />
          Convidar
        </Button>
      </div>

      <div style={{ fontSize: 12.5, color: T.ink3, lineHeight: 1.5, marginBottom: 14 }}>
        Entrar nesta organização exige convite. Um link só pode ser usado uma vez e apenas
        pelo e-mail para o qual foi emitido.
      </div>

      {loadError && (
        <div style={{ marginBottom: 12 }}>
          <Alert variant="danger">{loadError}</Alert>
        </div>
      )}
      {actionError && (
        <div style={{ marginBottom: 12 }}>
          <Alert variant="danger">{actionError}</Alert>
        </div>
      )}

      {members === null ? (
        <div style={{ fontSize: 13, color: T.faint }}>Carregando membros…</div>
      ) : (
        <div style={blockStyle} role="table" aria-label="Membros da organização">
          <div style={headStyle(memberRowStyle)} role="row">
            <div role="columnheader">Pessoa</div>
            <div role="columnheader">Papel</div>
            <div role="columnheader" style={{ textAlign: 'right' }}>
              Ações
            </div>
          </div>
          {members.map((member) => {
            const isSelf = member.user_id === user.id
            return (
              <div key={member.user_id} style={memberRowStyle} role="row">
                <div role="cell" style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <Avatar name={member.full_name || member.email} size={26} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {member.full_name || '—'} {isSelf && <Tag variant="default">você</Tag>}
                    </div>
                    <div style={{ color: T.ink3, fontSize: 11.5 }}>{member.email}</div>
                  </div>
                </div>
                <div role="cell">
                  {isSelf ? (
                    <Tag variant="default">{member.role}</Tag>
                  ) : (
                    <select
                      aria-label={`Papel de ${member.full_name || member.email}`}
                      style={selectStyle}
                      value={member.role}
                      disabled={busy === member.user_id}
                      onChange={(event) => handleRoleChange(member, event.target.value as UserRole)}
                    >
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div role="cell" style={{ textAlign: 'right' }}>
                  {!isSelf && (
                    <Button
                      variant="default"
                      size="sm"
                      loading={busy === member.user_id}
                      onClick={() => handleRemove(member)}
                    >
                      Remover
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <MFIcon name="mail" size={14} color={T.ink3} />
        <span style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>Convites pendentes</span>
      </div>

      {invites === null ? (
        <div style={{ fontSize: 13, color: T.faint }}>Carregando convites…</div>
      ) : pendingInvites.length === 0 ? (
        <div style={{ fontSize: 12.5, color: T.faint, marginBottom: 16 }}>Nenhum convite pendente.</div>
      ) : (
        <div style={blockStyle} role="table" aria-label="Convites pendentes">
          <div style={headStyle(inviteRowStyle)} role="row">
            <div role="columnheader">E-mail</div>
            <div role="columnheader">Papel</div>
            <div role="columnheader" style={{ textAlign: 'right' }}>
              Status
            </div>
          </div>
          {pendingInvites.map((invite) => {
            const meta = INVITE_STATUS_LABEL[invite.status]
            return (
              <div key={invite.id} style={inviteRowStyle} role="row">
                <div role="cell" style={{ minWidth: 0 }}>
                  <div style={{ color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis' }}>{invite.email}</div>
                  <div style={{ color: T.faint, fontSize: 11 }}>
                    expira {new Date(invite.expires_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <div role="cell">
                  <Tag variant="default">{invite.role}</Tag>
                </div>
                <div
                  role="cell"
                  style={{ textAlign: 'right', display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}
                >
                  <Tag variant={meta.variant}>{meta.label}</Tag>
                  <Button
                    variant="default"
                    size="sm"
                    loading={busy === invite.id}
                    onClick={() => handleRevoke(invite)}
                  >
                    Revogar
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <NewInviteModal
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onCreated={(result) => {
          setInviteOpen(false)
          setCreated(result)
          setInvites((prev) => (prev ? [result.invite, ...prev] : [result.invite]))
        }}
      />
      <InviteCreatedModal result={created} onClose={() => setCreated(null)} />
    </div>
  )
}
