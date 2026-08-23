'use client'

import { CSSProperties, useMemo, useState } from 'react'
import { T } from '@/lib/tokens'
import { apiFetch } from '@/lib/api/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import {
  OnboardingFlow,
  OnboardingStepInput,
  OnboardingStepKind,
  OnboardingTemplate,
} from '@/lib/types/onboarding'
import { EditorOption, KIND_LABELS, OnboardingStepEditor, defaultsFor } from './OnboardingStepEditor'

interface OnboardingComposerProps {
  /** Editing an existing flow; omit to compose a new one. */
  flow?: { id: string; name: string; steps: OnboardingStepInput[] } | null
  templates: OnboardingTemplate[]
  repositories: EditorOption[]
  teams: EditorOption[]
  docs: EditorOption[]
  members: EditorOption[]
  /** People with no assignment yet — who a freshly published flow can go to. */
  candidates: EditorOption[]
  onClose: () => void
  onPublished: (flowId: string) => void
}

/** The blocks the library offers, grouped the way the mockup groups them. */
const BLOCK_LIBRARY: Array<{ kind: OnboardingStepKind; group: string; hint: string }> = [
  { kind: 'markdown', group: 'Escrever', hint: 'Um texto seu, em markdown' },
  { kind: 'repository', group: 'Catálogo', hint: 'Aponta para um repositório real' },
  { kind: 'team', group: 'Catálogo', hint: 'Mostra quem é o time e o que ele mantém' },
  { kind: 'doc', group: 'Documentação', hint: 'Uma geração de documentação existente' },
  { kind: 'architecture', group: 'Documentação', hint: 'O grafo de dependências da organização' },
  { kind: 'glossary', group: 'Documentação', hint: 'Os termos internos do glossário' },
  { kind: 'contacts', group: 'Pessoas', hint: 'Quem procurar, e quando' },
  { kind: 'checklist', group: 'Fazer', hint: 'Uma lista de itens para marcar' },
  { kind: 'link', group: 'Fazer', hint: 'Um link para fora da plataforma' },
  { kind: 'task', group: 'Fazer', hint: 'A primeira entrega esperada' },
  { kind: 'verified', group: 'Verificar', hint: 'A plataforma confirma que aconteceu' },
]

type Stage = 1 | 2 | 3

/**
 * The full-screen onboarding composer from the v3 redesign: name it, build the
 * path from blocks that point at real data, then decide who receives it.
 *
 * It replaces nothing on the server — publishing is the same create-flow,
 * save-steps and assign calls the settings page always made. What changes is
 * that the three decisions are separated, so the admin is never editing steps
 * and choosing recipients in the same crowded panel.
 */
export function OnboardingComposer({
  flow = null,
  templates,
  repositories,
  teams,
  docs,
  members,
  candidates,
  onClose,
  onPublished,
}: OnboardingComposerProps) {
  const editing = Boolean(flow)
  const [stage, setStage] = useState<Stage>(editing ? 2 : 1)
  const [name, setName] = useState(flow?.name ?? '')
  const [templateId, setTemplateId] = useState('')
  const [steps, setSteps] = useState<OnboardingStepInput[]>(flow?.steps ?? [])
  const [recipients, setRecipients] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const template = templates.find((item) => item.id === templateId) ?? null

  const totalMinutes = useMemo(
    () => steps.reduce((sum, step) => sum + (step.estimated_minutes ?? 0), 0),
    [steps]
  )
  const requiredCount = steps.filter((step) => step.is_required !== false).length

  const summary = `${steps.length} passo${steps.length === 1 ? '' : 's'} · ${requiredCount} obrigatório${
    requiredCount === 1 ? '' : 's'
  }${totalMinutes ? ` · ≈${totalMinutes} min` : ''}`

  const addBlock = (kind: OnboardingStepKind) => {
    const { body, config } = defaultsFor(kind)
    setSteps((prev) => [
      ...prev,
      { kind, title: KIND_LABELS[kind], body, config, is_required: true },
    ])
  }

  const useTemplate = () => {
    if (!template) {
      setSteps([])
      setStage(2)
      return
    }
    setSteps(
      template.steps.map((step) => ({
        kind: step.kind,
        title: step.title,
        body: step.body,
        config: step.config ?? {},
        is_required: step.is_required,
        estimated_minutes: step.estimated_minutes ?? null,
      }))
    )
    setStage(2)
  }

  const publish = async () => {
    if (!name.trim()) {
      setError('Dê um nome ao fluxo antes de publicar.')
      setStage(1)
      return
    }
    setBusy(true)
    setError(null)
    try {
      let flowId = flow?.id
      if (!flowId) {
        const created = await apiFetch<OnboardingFlow>('/api/onboarding/flows', {
          method: 'POST',
          body: JSON.stringify({ name: name.trim() }),
        })
        flowId = created.id
      } else if (name.trim() !== flow?.name) {
        await apiFetch(`/api/onboarding/flows/${flowId}`, {
          method: 'PATCH',
          body: JSON.stringify({ name: name.trim() }),
        })
      }

      await apiFetch(`/api/onboarding/flows/${flowId}/steps`, {
        method: 'PUT',
        body: JSON.stringify({ steps }),
      })

      // Assignments are created one by one: the API takes a single pair, and a
      // failure on one person must not silently drop the others.
      for (const userId of recipients) {
        await apiFetch('/api/onboarding/assignments', {
          method: 'POST',
          body: JSON.stringify({ flow_id: flowId, user_id: userId }),
        })
      }

      onPublished(flowId as string)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível publicar o fluxo.')
    } finally {
      setBusy(false)
    }
  }

  const overlayStyle: CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 65,
    background: T.bg,
    display: 'flex',
    flexDirection: 'column',
  }

  const topBarStyle: CSSProperties = {
    borderBottom: `1px solid ${T.border}`,
    background: T.surface,
    padding: '14px 28px',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    flexWrap: 'wrap',
  }

  const bottomBarStyle: CSSProperties = {
    borderTop: `1px solid ${T.border}`,
    background: T.surface,
    padding: '12px 28px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  }

  const railTitleStyle: CSSProperties = {
    fontSize: 11.5,
    letterSpacing: '.08em',
    textTransform: 'uppercase',
    color: T.faint,
    marginBottom: 12,
  }

  const blockStyle: CSSProperties = {
    textAlign: 'left',
    font: 'inherit',
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.card,
    padding: '10px 12px',
    cursor: 'pointer',
    color: T.ink,
  }

  const noteStyle: CSSProperties = {
    background: T.accentBg,
    borderRadius: T.radius.card,
    padding: '16px 18px',
    fontSize: 13.5,
    lineHeight: 1.6,
    color: T.accent900,
  }

  return (
    <div style={overlayStyle} role="dialog" aria-modal="true" aria-label="Compositor de onboarding">
      <div style={topBarStyle}>
        <h2 style={{ fontSize: 17, margin: 0 }}>
          {editing ? name || 'Editar onboarding' : 'Criar onboarding'}
        </h2>
        <span style={{ fontSize: 12.5, color: T.faint }}>Passo {stage} de 3</span>
        <span style={{ flex: 1 }} />
        {stage === 2 && <span style={{ fontSize: 12.5, color: T.faint }}>{summary}</span>}
        <button
          type="button"
          onClick={onClose}
          style={{
            font: 'inherit',
            fontSize: 13,
            background: 'none',
            border: 0,
            cursor: 'pointer',
            color: T.ink3,
          }}
        >
          Fechar
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px 28px 0' }}>
          <Alert variant="danger">{error}</Alert>
        </div>
      )}

      {stage === 1 && (
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 28,
          }}
        >
          <div style={{ width: '100%', maxWidth: 560 }}>
            <h1 style={{ fontSize: 30, margin: '0 0 8px' }}>Para quem é este onboarding?</h1>
            <p style={{ fontSize: 15, color: T.ink3, margin: '0 0 26px', lineHeight: 1.6 }}>
              Escolha um ponto de partida e montamos um rascunho a partir do que já existe na
              organização — repositórios do catálogo, documentação gerada, glossário e a verificação
              da primeira contribuição.
            </p>

            <Input
              label="Nome"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="ex: Dev backend — primeiros 30 dias"
              autoFocus
            />

            <div style={{ marginBottom: 14 }}>
              <label
                htmlFor="composer-template"
                style={{ display: 'block', fontSize: 12, marginBottom: 5, color: T.ink3 }}
              >
                A partir de
              </label>
              <select
                id="composer-template"
                value={templateId}
                onChange={(event) => setTemplateId(event.target.value)}
                style={{
                  width: '100%',
                  minHeight: 42,
                  padding: '10px 14px',
                  fontSize: 15,
                  fontFamily: T.font,
                  border: `1px solid ${T.border}`,
                  borderRadius: T.radius.input,
                  background: T.surface,
                  color: T.ink,
                  cursor: 'pointer',
                }}
              >
                <option value="">Fluxo vazio</option>
                {templates.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ ...noteStyle, margin: '6px 0 22px' }}>
              {template
                ? `${template.description} — ${template.steps.length} passo${
                    template.steps.length === 1 ? '' : 's'
                  } que você pode ajustar antes de publicar.`
                : 'Sem modelo, você começa com o caminho em branco e monta a partir dos blocos da organização.'}
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Button variant="primary" size="lg" onClick={useTemplate} disabled={!name.trim()}>
                {template ? 'Gerar rascunho' : 'Começar do zero'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {stage === 2 && (
        <>
          <div
            style={{
              flex: 1,
              overflow: 'hidden',
              display: 'grid',
              gridTemplateColumns: '250px minmax(0, 1fr) 330px',
            }}
          >
            <div style={{ borderRight: `1px solid ${T.border}`, overflow: 'auto', padding: 18 }}>
              <div style={railTitleStyle}>Blocos da sua organização</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {BLOCK_LIBRARY.map((block) => (
                  <button
                    key={block.kind}
                    type="button"
                    style={blockStyle}
                    aria-label={`Adicionar ${KIND_LABELS[block.kind]}`}
                    onClick={() => addBlock(block.kind)}
                  >
                    <span
                      style={{
                        display: 'block',
                        fontSize: 10.5,
                        letterSpacing: '.08em',
                        textTransform: 'uppercase',
                        color: T.faint,
                      }}
                    >
                      {block.group}
                    </span>
                    <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, marginTop: 3 }}>
                      {KIND_LABELS[block.kind]}
                    </span>
                    <span style={{ display: 'block', fontSize: 12, color: T.faint, marginTop: 2 }}>
                      {block.hint}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ overflow: 'auto', padding: '20px 24px' }}>
              {steps.length === 0 ? (
                <div style={{ fontSize: 14, color: T.faint, maxWidth: '44ch', lineHeight: 1.6 }}>
                  Clique em um bloco à esquerda para montar o caminho. Cada bloco já vem apontando
                  para um dado real da organização.
                </div>
              ) : (
                <OnboardingStepEditor
                  steps={steps}
                  onChange={setSteps}
                  repositories={repositories}
                  teams={teams}
                  docs={docs}
                  members={members}
                  hideAddBar
                />
              )}
            </div>

            <div
              style={{
                borderLeft: `1px solid ${T.border}`,
                overflow: 'auto',
                padding: 20,
                background: T.surface,
              }}
            >
              <div style={railTitleStyle}>Como a pessoa vai ver</div>
              {steps.length === 0 ? (
                <div style={{ fontSize: 13, color: T.faint }}>Nada para pré-visualizar ainda.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {steps.map((step, index) => (
                    <div
                      key={step.id ?? `preview-${index}`}
                      style={{ background: T.bg, borderRadius: T.radius.card, padding: 14 }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>
                          {index + 1}. {step.title}
                        </span>
                        <span style={{ flex: 1 }} />
                        {step.estimated_minutes ? (
                          <span style={{ fontSize: 12, color: T.faint }}>
                            ≈{step.estimated_minutes} min
                          </span>
                        ) : null}
                      </div>
                      <div style={{ fontSize: 12, color: T.faint, marginTop: 6 }}>
                        {KIND_LABELS[step.kind]} ·{' '}
                        {step.is_required === false ? 'opcional' : 'obrigatório'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={bottomBarStyle}>
            <Button variant="ghost" size="md" onClick={() => setStage(1)}>
              Voltar
            </Button>
            <span style={{ flex: 1 }} />
            <span style={{ fontSize: 12.5, color: T.faint }}>{summary}</span>
            <Button
              variant="primary"
              size="md"
              disabled={steps.length === 0}
              onClick={() => setStage(3)}
            >
              Revisar e publicar
            </Button>
          </div>
        </>
      )}

      {stage === 3 && (
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', padding: 28 }}>
          <div style={{ width: '100%', maxWidth: 600 }}>
            <h1 style={{ fontSize: 28, margin: '0 0 8px' }}>{name}</h1>
            <p style={{ fontSize: 14, color: T.ink3, margin: '0 0 24px' }}>{summary}</p>

            <div
              style={{
                fontSize: 11.5,
                letterSpacing: '.08em',
                textTransform: 'uppercase',
                color: T.faint,
                marginBottom: 10,
              }}
            >
              Quem recebe agora
            </div>

            {candidates.length === 0 ? (
              <div style={{ fontSize: 13.5, color: T.faint, marginBottom: 18 }}>
                Todo mundo já está em algum fluxo.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
                {candidates.map((person) => (
                  <label
                    key={person.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      background: T.surface,
                      borderRadius: T.radius.card,
                      padding: '11px 14px',
                      fontSize: 14,
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={recipients.has(person.id)}
                      onChange={(event) =>
                        setRecipients((prev) => {
                          const next = new Set(prev)
                          if (event.target.checked) next.add(person.id)
                          else next.delete(person.id)
                          return next
                        })
                      }
                      style={{ accentColor: T.accent, width: 15, height: 15, cursor: 'pointer' }}
                    />
                    <span>{person.label}</span>
                  </label>
                ))}
              </div>
            )}

            <div style={{ ...noteStyle, marginBottom: 22 }}>
              {recipients.size === 0
                ? 'Publicar sem escolher ninguém salva o fluxo — você atribui depois, ou ele é usado como padrão em novos convites.'
                : `${recipients.size} pessoa${recipients.size === 1 ? '' : 's'} começa${
                    recipients.size === 1 ? '' : 'm'
                  } este onboarding assim que você publicar.`}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <Button variant="default" size="lg" onClick={() => setStage(2)}>
                Voltar ao compositor
              </Button>
              <Button variant="primary" size="lg" loading={busy} onClick={() => void publish()}>
                {editing ? 'Salvar fluxo' : 'Publicar onboarding'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
