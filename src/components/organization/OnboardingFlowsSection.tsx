'use client'

import { CSSProperties, useCallback, useEffect, useState } from 'react'
import { T } from '@/lib/tokens'
import { apiFetch } from '@/lib/api/client'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Tag } from '@/components/ui/Tag'
import {
  OnboardingAssignmentListResponse,
  OnboardingAssignmentSummary,
  OnboardingFlow,
  OnboardingFlowListResponse,
  OnboardingStepInput,
  OnboardingTemplateListResponse,
  OnboardingTemplate,
} from '@/lib/types/onboarding'
import { MemberListResponse } from '@/lib/types/organization-members'
import { RepositoryListResponse } from '@/lib/types/repository'
import { TeamListResponse } from '@/lib/types/teams'
import { DocGenerationListResponse } from '@/lib/types/docs'
import { EditorOption } from './OnboardingStepEditor'
import { OnboardingComposer } from './OnboardingComposer'

interface ComposerTarget {
  id: string
  name: string
  steps: OnboardingStepInput[]
}

/**
 * The admin side of onboarding: the flows the organization offers, and who is
 * currently walking one.
 *
 * Editing a flow's steps happens in the full-screen composer
 * (`OnboardingComposer`) rather than inline — building a path and reading a
 * settings page are different tasks, and v3 stopped making them share a panel.
 * Saving still sends the whole step list with existing ids, which is what keeps
 * the progress of anyone mid-flow intact while an admin fixes a typo.
 */
export function OnboardingFlowsSection({ canEdit }: { canEdit: boolean }) {
  const [flows, setFlows] = useState<OnboardingFlow[] | null>(null)
  const [templates, setTemplates] = useState<OnboardingTemplate[]>([])

  const [repositories, setRepositories] = useState<EditorOption[]>([])
  const [teams, setTeams] = useState<EditorOption[]>([])
  const [docs, setDocs] = useState<EditorOption[]>([])
  const [members, setMembers] = useState<EditorOption[]>([])
  const [assignments, setAssignments] = useState<OnboardingAssignmentSummary[]>([])

  const [composerOpen, setComposerOpen] = useState(false)
  const [composerTarget, setComposerTarget] = useState<ComposerTarget | null>(null)

  const [assignMember, setAssignMember] = useState('')
  const [assignFlow, setAssignFlow] = useState('')

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const loadFlows = useCallback(async () => {
    try {
      const response = await apiFetch<OnboardingFlowListResponse>('/api/onboarding/flows')
      setFlows(response.items ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar os fluxos.')
      setFlows([])
    }
  }, [])

  const loadPickers = useCallback(async () => {
    // Everything a step can point at, so the composer offers real choices
    // rather than free-text ids.
    const [repos, teamList, docList, memberList, assignmentList] = await Promise.all([
      apiFetch<RepositoryListResponse>('/api/repositories?limit=100').catch(() => null),
      apiFetch<TeamListResponse>('/api/teams').catch(() => null),
      apiFetch<DocGenerationListResponse>('/api/organizations/docs').catch(() => null),
      apiFetch<MemberListResponse>('/api/organizations/members').catch(() => null),
      apiFetch<OnboardingAssignmentListResponse>('/api/onboarding/assignments').catch(() => null),
    ])
    setRepositories((repos?.repositories ?? []).map((repo) => ({ id: repo.id, label: repo.name })))
    setTeams((teamList?.items ?? []).map((team) => ({ id: team.id, label: team.name })))
    setDocs(
      (docList?.items ?? []).map((doc) => ({
        id: doc.id,
        label: `${(doc.types ?? []).join(', ') || 'documento'} · ${new Date(doc.created_at).toLocaleDateString('pt-BR')}`,
      }))
    )
    setMembers(
      (memberList?.items ?? []).map((member) => ({
        id: member.user_id,
        label: member.full_name || member.email,
      }))
    )
    setAssignments(assignmentList?.items ?? [])
  }, [])

  useEffect(() => {
    void loadFlows()
    void loadPickers()
    void apiFetch<OnboardingTemplateListResponse>('/api/onboarding/templates')
      .then((response) => setTemplates(response.items ?? []))
      .catch(() => setTemplates([]))
  }, [loadFlows, loadPickers])

  const openComposerFor = async (flowId: string) => {
    setError(null)
    try {
      const flow = await apiFetch<OnboardingFlow>(`/api/onboarding/flows/${flowId}`)
      setComposerTarget({
        id: flow.id,
        name: flow.name,
        steps: (flow.steps ?? []).map((step) => ({
          // Carrying the id is what preserves progress across a save.
          id: step.id,
          kind: step.kind,
          title: step.title,
          body: step.body,
          config: step.config ?? {},
          is_required: step.is_required,
          estimated_minutes: step.estimated_minutes ?? null,
        })),
      })
      setComposerOpen(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar o fluxo.')
    }
  }

  const flowAction = async (path: string, method: string, successMessage: string) => {
    setBusy(true)
    setError(null)
    try {
      await apiFetch(path, { method })
      setMessage(successMessage)
      await loadFlows()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'A ação falhou.')
    } finally {
      setBusy(false)
    }
  }

  const setDefault = async (flowId: string) => {
    setBusy(true)
    try {
      await apiFetch(`/api/onboarding/flows/${flowId}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_default: true }),
      })
      await loadFlows()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível definir o padrão.')
    } finally {
      setBusy(false)
    }
  }

  const assign = async () => {
    if (!assignMember || !assignFlow) return
    setBusy(true)
    setError(null)
    try {
      await apiFetch('/api/onboarding/assignments', {
        method: 'POST',
        body: JSON.stringify({ flow_id: assignFlow, user_id: assignMember }),
      })
      setAssignMember('')
      setMessage('Fluxo atribuído.')
      await loadPickers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível atribuir o fluxo.')
    } finally {
      setBusy(false)
    }
  }

  const assignedUserIds = new Set(assignments.map((item) => item.user_id))
  const candidates = members.filter((member) => !assignedUserIds.has(member.id))

  const rowStyle: CSSProperties = {
    background: T.bg,
    borderRadius: T.radius.card,
    padding: '14px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  }

  const linkButtonStyle = (tone: 'accent' | 'danger'): CSSProperties => ({
    font: 'inherit',
    fontSize: 12.5,
    background: 'none',
    border: 0,
    cursor: 'pointer',
    color: tone === 'danger' ? T.danger : T.accent700,
    padding: 0,
  })

  const selectStyle: CSSProperties = {
    minHeight: 38,
    padding: '8px 12px',
    fontSize: 13,
    fontFamily: T.font,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.input,
    background: T.surface,
    color: T.ink,
    cursor: 'pointer',
    width: '100%',
  }

  const fieldLabelStyle: CSSProperties = {
    display: 'block',
    fontSize: 12,
    marginBottom: 5,
    color: T.ink3,
  }

  return (
    <div>
      <p style={{ fontSize: 13.5, color: T.ink3, margin: '0 0 18px', maxWidth: '70ch', lineHeight: 1.55 }}>
        Cada fluxo é um caminho pela organização. Passos que apontam para repositório, time ou
        documentação leem o dado ao vivo — o onboarding não envelhece quando as coisas mudam.
      </p>

      {error && (
        <div style={{ marginBottom: 12 }}>
          <Alert variant="danger">{error}</Alert>
        </div>
      )}
      {message && (
        <div style={{ marginBottom: 12 }}>
          <Alert variant="ok">{message}</Alert>
        </div>
      )}

      {canEdit && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setComposerTarget(null)
              setComposerOpen(true)
            }}
          >
            Criar onboarding
          </Button>
          <span style={{ fontSize: 13, color: T.faint }}>
            Três passos: para quem é, o que a pessoa percorre, quem recebe.
          </span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {flows === null ? (
          <div style={{ fontSize: 13, color: T.faint }}>Carregando…</div>
        ) : flows.length === 0 ? (
          <div style={{ fontSize: 13.5, color: T.faint }}>Nenhum fluxo ainda.</div>
        ) : (
          flows.map((flow) => (
            <div key={flow.id} style={rowStyle}>
              <span style={{ minWidth: 220 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{flow.name}</span>
                  {flow.is_default && <Tag variant="accent">padrão</Tag>}
                </span>
                <span style={{ display: 'block', fontSize: 12.5, color: T.faint, marginTop: 4 }}>
                  {flow.step_count} passo{flow.step_count === 1 ? '' : 's'}
                  {flow.total_minutes ? ` · ≈${flow.total_minutes} min` : ''}
                </span>
              </span>
              <span style={{ flex: 1 }} />
              {canEdit && (
                <>
                  <Button variant="default" size="sm" onClick={() => void openComposerFor(flow.id)}>
                    Abrir compositor
                  </Button>
                  {!flow.is_default && (
                    <button
                      type="button"
                      style={linkButtonStyle('accent')}
                      disabled={busy}
                      onClick={() => void setDefault(flow.id)}
                    >
                      Tornar padrão
                    </button>
                  )}
                  <button
                    type="button"
                    style={linkButtonStyle('accent')}
                    disabled={busy}
                    onClick={() =>
                      void flowAction(
                        `/api/onboarding/flows/${flow.id}/duplicate`,
                        'POST',
                        'Fluxo duplicado.'
                      )
                    }
                  >
                    Duplicar
                  </button>
                  <button
                    type="button"
                    style={linkButtonStyle('danger')}
                    disabled={busy}
                    onClick={() =>
                      void flowAction(`/api/onboarding/flows/${flow.id}`, 'DELETE', 'Fluxo removido.')
                    }
                  >
                    Remover
                  </button>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* Who is onboarding, how far along, and what they said was missing. */}
      <div style={{ marginTop: 28, borderTop: `1px solid ${T.neutral200}`, paddingTop: 20 }}>
        <h3 style={{ fontSize: 16, margin: '0 0 4px' }}>Quem está no onboarding</h3>
        <p style={{ fontSize: 13, color: T.ink3, margin: '0 0 16px' }}>
          Atribuições vindas de convite ou feitas à mão.
        </p>

        {canEdit && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 16 }}>
            <div style={{ width: 200 }}>
              <label htmlFor="assign-member" style={fieldLabelStyle}>
                Pessoa
              </label>
              <select
                id="assign-member"
                style={selectStyle}
                value={assignMember}
                onChange={(event) => setAssignMember(event.target.value)}
              >
                <option value="">Escolher…</option>
                {candidates.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.label}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ width: 230 }}>
              <label htmlFor="assign-flow" style={fieldLabelStyle}>
                Fluxo
              </label>
              <select
                id="assign-flow"
                style={selectStyle}
                value={assignFlow}
                onChange={(event) => setAssignFlow(event.target.value)}
              >
                <option value="">Escolher…</option>
                {(flows ?? []).map((flow) => (
                  <option key={flow.id} value={flow.id}>
                    {flow.name}
                  </option>
                ))}
              </select>
            </div>
            <Button
              variant="primary"
              size="md"
              loading={busy}
              disabled={!assignMember || !assignFlow}
              onClick={() => void assign()}
            >
              Atribuir
            </Button>
          </div>
        )}

        {assignments.length === 0 ? (
          <div style={{ fontSize: 13.5, color: T.faint }}>Ninguém em onboarding agora.</div>
        ) : (
          assignments.map((assignment) => (
            <div
              key={assignment.id}
              style={{ padding: '12px 0', borderTop: `1px solid ${T.neutral200}` }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 14, fontWeight: 600, minWidth: 140 }}>
                  {assignment.user_name || assignment.user_email || assignment.user_id}
                </span>
                <Tag>{assignment.flow_name}</Tag>
                <span
                  style={{
                    fontSize: 12.5,
                    color: assignment.status === 'completed' ? T.ok : T.warn,
                  }}
                >
                  {assignment.steps_done}/{assignment.steps_total} ·{' '}
                  {assignment.status === 'completed' ? 'concluído' : 'em andamento'}
                </span>
              </div>
              {assignment.feedback && (
                <div style={{ marginTop: 6, fontSize: 13, color: T.ink3 }}>
                  Disse que faltou: {assignment.feedback}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {composerOpen && (
        <OnboardingComposer
          flow={composerTarget}
          templates={templates}
          repositories={repositories}
          teams={teams}
          docs={docs}
          members={members}
          candidates={candidates}
          onClose={() => {
            setComposerOpen(false)
            setComposerTarget(null)
          }}
          onPublished={async () => {
            setComposerOpen(false)
            setComposerTarget(null)
            setMessage('Onboarding publicado.')
            await loadFlows()
            await loadPickers()
          }}
        />
      )}
    </div>
  )
}
