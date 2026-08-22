'use client'

import { CSSProperties, useCallback, useEffect, useState } from 'react'
import { T } from '@/lib/tokens'
import { apiFetch } from '@/lib/api/client'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Tag } from '@/components/ui/Tag'
import { MFIcon } from '@/components/icons/MFIcon'
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
import { EditorOption, OnboardingStepEditor } from './OnboardingStepEditor'

/**
 * The builder: flows on the left, the selected flow's steps on the right, and
 * the progress dashboard underneath.
 *
 * Saving sends the whole step list, and steps that already exist carry their
 * id — the server updates those rows in place, which is what keeps the progress
 * of anyone mid-flow intact while an admin fixes a typo.
 */
export function OnboardingFlowsSection({ canEdit }: { canEdit: boolean }) {
  const [flows, setFlows] = useState<OnboardingFlow[] | null>(null)
  const [templates, setTemplates] = useState<OnboardingTemplate[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [steps, setSteps] = useState<OnboardingStepInput[]>([])
  const [dirty, setDirty] = useState(false)

  const [repositories, setRepositories] = useState<EditorOption[]>([])
  const [teams, setTeams] = useState<EditorOption[]>([])
  const [docs, setDocs] = useState<EditorOption[]>([])
  const [members, setMembers] = useState<EditorOption[]>([])
  const [assignments, setAssignments] = useState<OnboardingAssignmentSummary[]>([])

  const [newName, setNewName] = useState('')
  const [newTemplate, setNewTemplate] = useState('')
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
    // Everything a step can point at, so the editor offers real choices rather
    // than free-text ids.
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

  const selectFlow = async (flowId: string) => {
    setSelectedId(flowId)
    setDirty(false)
    setError(null)
    try {
      const flow = await apiFetch<OnboardingFlow>(`/api/onboarding/flows/${flowId}`)
      setSteps(
        (flow.steps ?? []).map((step) => ({
          // Carrying the id is what preserves progress across a save.
          id: step.id,
          kind: step.kind,
          title: step.title,
          body: step.body,
          config: step.config ?? {},
          is_required: step.is_required,
          estimated_minutes: step.estimated_minutes ?? null,
        }))
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar o fluxo.')
      setSteps([])
    }
  }

  const createFlow = async () => {
    if (!newName.trim()) return
    setBusy(true)
    setError(null)
    try {
      const flow = await apiFetch<OnboardingFlow>('/api/onboarding/flows', {
        method: 'POST',
        body: JSON.stringify({ name: newName.trim(), template_id: newTemplate || undefined }),
      })
      setNewName('')
      setNewTemplate('')
      await loadFlows()
      await selectFlow(flow.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar o fluxo.')
    } finally {
      setBusy(false)
    }
  }

  const saveSteps = async () => {
    if (!selectedId) return
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      await apiFetch(`/api/onboarding/flows/${selectedId}/steps`, {
        method: 'PUT',
        body: JSON.stringify({ steps }),
      })
      setDirty(false)
      setMessage('Passos salvos.')
      await loadFlows()
      await selectFlow(selectedId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar os passos.')
    } finally {
      setBusy(false)
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

  const layoutStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20 }
  const cardStyle: CSSProperties = {
    padding: '12px 14px',
    borderRadius: T.radius.card,
    border: `1px solid ${T.border}`,
    background: T.surface,
  }
  const flowItemStyle = (active: boolean): CSSProperties => ({
    ...cardStyle,
    marginBottom: 8,
    cursor: 'pointer',
    borderColor: active ? T.ink : T.border,
  })

  const selected = flows?.find((flow) => flow.id === selectedId) ?? null

  return (
    <div>
      <p style={{ fontSize: 13, color: T.ink3, margin: '0 0 14px', maxWidth: 640 }}>
        Cada fluxo é um caminho pela organização. Passos que apontam para repositório, time, documentação ou
        arquitetura leem o dado ao vivo — então o onboarding não envelhece quando as coisas mudam.
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
        <div style={{ ...cardStyle, marginBottom: 16, display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <Input
              label="Novo fluxo"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="Dev backend"
            />
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12.5, fontWeight: 500, marginBottom: 4 }}>A partir de</div>
            <select
              value={newTemplate}
              aria-label="Modelo inicial"
              onChange={(event) => setNewTemplate(event.target.value)}
              style={{
                padding: '7px 10px',
                fontSize: 13,
                fontFamily: T.font,
                border: `1px solid ${T.border}`,
                borderRadius: T.radius.input,
                background: T.surface,
                color: T.ink,
              }}
            >
              <option value="">Fluxo vazio</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.label}
                </option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 14 }}>
            <Button variant="primary" size="md" loading={busy} disabled={!newName.trim()} onClick={() => void createFlow()}>
              Criar
            </Button>
          </div>
        </div>
      )}

      <div style={layoutStyle}>
        <div>
          {flows === null ? (
            <div style={{ fontSize: 13, color: T.faint }}>Carregando…</div>
          ) : flows.length === 0 ? (
            <div style={{ fontSize: 13, color: T.faint }}>Nenhum fluxo ainda.</div>
          ) : (
            flows.map((flow) => (
              <div
                key={flow.id}
                style={flowItemStyle(flow.id === selectedId)}
                onClick={() => void selectFlow(flow.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') void selectFlow(flow.id)
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{flow.name}</span>
                  {flow.is_default && <Tag variant="ok">padrão</Tag>}
                </div>
                <div style={{ fontSize: 12, color: T.faint }}>
                  {flow.step_count} passo(s)
                  {flow.total_minutes ? ` · ≈${flow.total_minutes} min` : ''}
                </div>
              </div>
            ))
          )}
        </div>

        <div>
          {!selected ? (
            <div style={{ fontSize: 13, color: T.faint }}>Escolha um fluxo para editar seus passos.</div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{selected.name}</h3>
                {canEdit && !selected.is_default && (
                  <Button variant="default" size="sm" disabled={busy} onClick={() => void setDefault(selected.id)}>
                    Tornar padrão
                  </Button>
                )}
                {canEdit && (
                  <Button
                    variant="default"
                    size="sm"
                    disabled={busy}
                    onClick={() =>
                      void flowAction(`/api/onboarding/flows/${selected.id}/duplicate`, 'POST', 'Fluxo duplicado.')
                    }
                  >
                    Duplicar
                  </Button>
                )}
                {canEdit && (
                  <Button
                    variant="default"
                    size="sm"
                    disabled={busy}
                    onClick={() => {
                      void flowAction(`/api/onboarding/flows/${selected.id}`, 'DELETE', 'Fluxo removido.')
                      setSelectedId(null)
                      setSteps([])
                    }}
                  >
                    Remover
                  </Button>
                )}
                {dirty && (
                  <span style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: T.warn }}>alterações não salvas</span>
                    <Button variant="primary" size="sm" loading={busy} onClick={() => void saveSteps()}>
                      Salvar passos
                    </Button>
                  </span>
                )}
              </div>

              <OnboardingStepEditor
                steps={steps}
                onChange={(next) => {
                  setSteps(next)
                  setDirty(true)
                }}
                repositories={repositories}
                teams={teams}
                docs={docs}
                members={members}
                disabled={!canEdit || busy}
              />

              {!dirty && canEdit && (
                <div style={{ marginTop: 12 }}>
                  <Button variant="primary" size="md" loading={busy} onClick={() => void saveSteps()}>
                    Salvar passos
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Who is onboarding, how far along, and what they said was missing. */}
      <div style={{ marginTop: 26 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 4px' }}>Quem está no onboarding</h3>
        <p style={{ fontSize: 12.5, color: T.ink3, margin: '0 0 12px' }}>
          Atribuições vindas de convite ou feitas à mão.
        </p>
        {assignments.length === 0 ? (
          <div style={{ fontSize: 13, color: T.faint }}>Ninguém em onboarding agora.</div>
        ) : (
          assignments.map((assignment) => (
            <div key={assignment.id} style={{ ...cardStyle, marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MFIcon name="user" size={12} color={T.faint} />
                <span style={{ fontWeight: 600, fontSize: 13 }}>
                  {assignment.user_name || assignment.user_email || assignment.user_id}
                </span>
                <Tag>{assignment.flow_name}</Tag>
                {assignment.status === 'completed' ? (
                  <Tag variant="ok">concluído</Tag>
                ) : (
                  <Tag variant="warn">
                    {assignment.steps_done}/{assignment.steps_total}
                  </Tag>
                )}
              </div>
              {assignment.feedback && (
                <div style={{ marginTop: 8, fontSize: 12.5, color: T.ink3 }}>
                  <strong style={{ color: T.ink }}>Disse que faltou:</strong> {assignment.feedback}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
