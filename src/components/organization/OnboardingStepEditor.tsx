'use client'

import { CSSProperties, useState } from 'react'
import { T } from '@/lib/tokens'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Tag } from '@/components/ui/Tag'
import { Toggle } from '@/components/ui/Toggle'
import { MFIcon } from '@/components/icons/MFIcon'
import {
  OnboardingStepConfig,
  OnboardingStepInput,
  OnboardingStepKind,
} from '@/lib/types/onboarding'

export interface EditorOption {
  id: string
  label: string
}

interface OnboardingStepEditorProps {
  steps: OnboardingStepInput[]
  onChange: (steps: OnboardingStepInput[]) => void
  repositories: EditorOption[]
  teams: EditorOption[]
  docs: EditorOption[]
  members: EditorOption[]
  disabled?: boolean
  /**
   * Hides the "add step" row. The composer offers its own block library, and
   * two ways to add a step in the same column reads as a bug.
   */
  hideAddBar?: boolean
}

/**
 * Edits a flow's step list.
 *
 * Two things it is careful about:
 *
 * - It never drops the `id` of a step that already exists. The server preserves
 *   those rows on save, which is what keeps everyone's progress alive across an
 *   edit; minting a new id here would silently wipe it.
 * - Each kind exposes only the fields it needs. A repository step gets a
 *   repository picker, not a free-text id, so a flow cannot be saved pointing
 *   at something that does not exist.
 */

export const KIND_LABELS: Record<OnboardingStepKind, string> = {
  markdown: 'Texto (markdown)',
  repository: 'Repositório',
  team: 'Time',
  doc: 'Documentação gerada',
  architecture: 'Mapa de arquitetura',
  glossary: 'Glossário',
  contacts: 'Contatos',
  checklist: 'Checklist',
  link: 'Link externo',
  verified: 'Verificado pela plataforma',
  task: 'Tarefa inicial',
}

/** Defaults that keep a freshly added step valid, so the first save cannot
 * fail on a field the person has not reached yet. */
export function defaultsFor(kind: OnboardingStepKind): { body: string; config: OnboardingStepConfig } {
  switch (kind) {
    case 'markdown':
      return { body: '## Título\n\nEscreva aqui.', config: {} }
    case 'checklist':
      return { body: '', config: { items: [{ text: 'Primeiro item' }] } }
    case 'link':
      return { body: '', config: { url: 'https://', label: 'Abrir' } }
    case 'task':
      return { body: '', config: { instructions: 'O que se espera da primeira entrega.' } }
    case 'verified':
      return { body: '', config: { check: 'team_membership' } }
    default:
      return { body: '', config: {} }
  }
}

export function OnboardingStepEditor({
  steps,
  onChange,
  repositories,
  teams,
  docs,
  members,
  disabled,
  hideAddBar = false,
}: OnboardingStepEditorProps) {
  const [adding, setAdding] = useState<OnboardingStepKind>('markdown')

  const update = (index: number, patch: Partial<OnboardingStepInput>) => {
    onChange(steps.map((step, i) => (i === index ? { ...step, ...patch } : step)))
  }

  const updateConfig = (index: number, patch: Partial<OnboardingStepConfig>) => {
    onChange(
      steps.map((step, i) => (i === index ? { ...step, config: { ...step.config, ...patch } } : step))
    )
  }

  const move = (index: number, delta: number) => {
    const target = index + delta
    if (target < 0 || target >= steps.length) return
    const next = [...steps]
    const [moved] = next.splice(index, 1)
    next.splice(target, 0, moved)
    onChange(next)
  }

  const remove = (index: number) => onChange(steps.filter((_, i) => i !== index))

  const add = () => {
    const { body, config } = defaultsFor(adding)
    onChange([...steps, { kind: adding, title: KIND_LABELS[adding], body, config, is_required: true }])
  }

  const cardStyle: CSSProperties = {
    padding: '14px 16px',
    borderRadius: T.radius.card,
    border: `1px solid ${T.border}`,
    background: T.surface,
    marginBottom: 10,
  }

  const rowStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }
  const selectStyle: CSSProperties = {
    padding: '6px 8px',
    fontSize: 13,
    fontFamily: T.font,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.input,
    background: T.surface,
    color: T.ink,
  }
  const textareaStyle: CSSProperties = {
    width: '100%',
    padding: '8px 10px',
    fontSize: 13,
    fontFamily: T.mono ?? T.font,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.input,
    background: T.surface,
    color: T.ink,
    resize: 'vertical',
  }

  const picker = (
    index: number,
    label: string,
    options: EditorOption[],
    value: string | undefined,
    onPick: (id: string) => void,
    emptyHint: string
  ) => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 12.5, fontWeight: 500, marginBottom: 4 }}>{label}</div>
      {options.length === 0 ? (
        <div style={{ fontSize: 12.5, color: T.warn }}>{emptyHint}</div>
      ) : (
        <select
          style={selectStyle}
          value={value ?? ''}
          aria-label={label}
          onChange={(event) => onPick(event.target.value)}
        >
          <option value="">Selecione…</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </div>
  )

  const configFields = (step: OnboardingStepInput, index: number) => {
    switch (step.kind) {
      case 'markdown':
        return (
          <textarea
            rows={6}
            style={textareaStyle}
            value={step.body ?? ''}
            aria-label="Conteúdo em markdown"
            onChange={(event) => update(index, { body: event.target.value })}
          />
        )

      case 'repository':
        return picker(
          index,
          'Repositório',
          repositories,
          step.config.repository_id,
          (id) => updateConfig(index, { repository_id: id }),
          'Nenhum repositório no catálogo ainda.'
        )

      case 'team':
        return picker(
          index,
          'Time',
          teams,
          step.config.team_id,
          (id) => updateConfig(index, { team_id: id }),
          'Nenhum time criado ainda — crie um na aba Times.'
        )

      case 'doc':
        return picker(
          index,
          'Documentação',
          docs,
          step.config.doc_generation_id,
          (id) => updateConfig(index, { doc_generation_id: id }),
          'Nenhuma documentação gerada ainda.'
        )

      case 'contacts':
        return (
          <div>
            {(step.config.people ?? []).map((person, personIndex) => (
              <div key={`${person.user_id}-${personIndex}`} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <select
                  style={selectStyle}
                  value={person.user_id}
                  aria-label="Pessoa"
                  onChange={(event) => {
                    const people = [...(step.config.people ?? [])]
                    people[personIndex] = { ...people[personIndex], user_id: event.target.value }
                    updateConfig(index, { people })
                  }}
                >
                  <option value="">Selecione…</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.label}
                    </option>
                  ))}
                </select>
                <input
                  style={{ ...selectStyle, flex: 1 }}
                  placeholder="Área (ex.: acesso, deploy)"
                  aria-label="Área"
                  value={person.area ?? ''}
                  onChange={(event) => {
                    const people = [...(step.config.people ?? [])]
                    people[personIndex] = { ...people[personIndex], area: event.target.value }
                    updateConfig(index, { people })
                  }}
                />
                <input
                  style={{ ...selectStyle, flex: 1 }}
                  placeholder="Quando procurar"
                  aria-label="Quando procurar"
                  value={person.when_to_reach ?? ''}
                  onChange={(event) => {
                    const people = [...(step.config.people ?? [])]
                    people[personIndex] = { ...people[personIndex], when_to_reach: event.target.value }
                    updateConfig(index, { people })
                  }}
                />
                <Button
                  variant="default"
                  size="sm"
                  onClick={() =>
                    updateConfig(index, {
                      people: (step.config.people ?? []).filter((_, i) => i !== personIndex),
                    })
                  }
                >
                  ×
                </Button>
              </div>
            ))}
            <Button
              variant="default"
              size="sm"
              onClick={() =>
                updateConfig(index, { people: [...(step.config.people ?? []), { user_id: '', area: '' }] })
              }
            >
              Adicionar pessoa
            </Button>
          </div>
        )

      case 'checklist':
        return (
          <div>
            {(step.config.items ?? []).map((item, itemIndex) => (
              <div key={itemIndex} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input
                  style={{ ...selectStyle, flex: 1 }}
                  value={item.text}
                  aria-label={`Item ${itemIndex + 1}`}
                  onChange={(event) => {
                    const items = [...(step.config.items ?? [])]
                    items[itemIndex] = { ...items[itemIndex], text: event.target.value }
                    updateConfig(index, { items })
                  }}
                />
                <Button
                  variant="default"
                  size="sm"
                  onClick={() =>
                    updateConfig(index, { items: (step.config.items ?? []).filter((_, i) => i !== itemIndex) })
                  }
                >
                  ×
                </Button>
              </div>
            ))}
            <Button
              variant="default"
              size="sm"
              onClick={() => updateConfig(index, { items: [...(step.config.items ?? []), { text: '' }] })}
            >
              Adicionar item
            </Button>
          </div>
        )

      case 'link':
        return (
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              style={{ ...selectStyle, flex: 2 }}
              placeholder="https://"
              aria-label="URL"
              value={step.config.url ?? ''}
              onChange={(event) => updateConfig(index, { url: event.target.value })}
            />
            <input
              style={{ ...selectStyle, flex: 1 }}
              placeholder="Rótulo"
              aria-label="Rótulo do link"
              value={step.config.label ?? ''}
              onChange={(event) => updateConfig(index, { label: event.target.value })}
            />
          </div>
        )

      case 'task':
        return (
          <div>
            <textarea
              rows={3}
              style={textareaStyle}
              placeholder="O que se espera dessa primeira entrega"
              aria-label="Instruções da tarefa"
              value={step.config.instructions ?? ''}
              onChange={(event) => updateConfig(index, { instructions: event.target.value })}
            />
            <input
              style={{ ...selectStyle, width: '100%', marginTop: 8 }}
              placeholder="Link do board ou da issue (opcional)"
              aria-label="Link da tarefa"
              value={step.config.task_url ?? ''}
              onChange={(event) => updateConfig(index, { task_url: event.target.value })}
            />
          </div>
        )

      case 'verified':
        return (
          <div>
            <select
              style={selectStyle}
              value={step.config.check ?? 'team_membership'}
              aria-label="O que verificar"
              onChange={(event) =>
                updateConfig(index, { check: event.target.value as OnboardingStepConfig['check'] })
              }
            >
              <option value="team_membership">Está num time</option>
              <option value="first_change_request">Abriu o primeiro PR/MR num repositório</option>
            </select>
            {step.config.check === 'first_change_request' &&
              picker(
                index,
                'Repositório onde verificar',
                repositories,
                step.config.repository_id,
                (id) => updateConfig(index, { repository_id: id }),
                'Nenhum repositório no catálogo ainda.'
              )}
            <div style={{ fontSize: 12, color: T.faint, marginTop: 6 }}>
              A plataforma confere sozinha e mostra como conferiu. Quando não conseguir olhar — provedor sem
              token, pessoa que nunca entrou por ele — informa isso, em vez de reprovar.
            </div>
          </div>
        )

      case 'architecture':
      case 'glossary':
        return (
          <div style={{ fontSize: 12.5, color: T.ink3 }}>
            Mostra tudo que existe na organização, e continua atualizado sozinho conforme as coisas mudam.
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div>
      {steps.map((step, index) => (
        <div key={step.id ?? `new-${index}`} style={cardStyle}>
          <div style={rowStyle}>
            <span style={{ fontSize: 12, color: T.faint, width: 18 }}>{index + 1}</span>
            <Tag>{KIND_LABELS[step.kind]}</Tag>
            {step.id ? <Tag variant="ok">salvo</Tag> : <Tag variant="accent">novo</Tag>}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
              <Button variant="default" size="sm" disabled={disabled || index === 0} onClick={() => move(index, -1)}>
                ↑
              </Button>
              <Button
                variant="default"
                size="sm"
                disabled={disabled || index === steps.length - 1}
                onClick={() => move(index, 1)}
              >
                ↓
              </Button>
              <Button variant="default" size="sm" disabled={disabled} onClick={() => remove(index)}>
                Remover
              </Button>
            </div>
          </div>

          <Input
            label="Título"
            value={step.title}
            onChange={(event) => update(index, { title: event.target.value })}
          />

          {configFields(step, index)}

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 10 }}>
            <Toggle
              checked={step.is_required !== false}
              onChange={(checked) => update(index, { is_required: checked })}
              label="Obrigatório"
            />
            <div style={{ width: 150 }}>
              <Input
                label="Minutos estimados"
                type="number"
                min={0}
                value={step.estimated_minutes ?? ''}
                onChange={(event) =>
                  update(index, {
                    estimated_minutes: event.target.value === '' ? null : Number(event.target.value),
                  })
                }
              />
            </div>
          </div>
        </div>
      ))}

      {!hideAddBar && (
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12 }}>
        <select
          style={selectStyle}
          value={adding}
          aria-label="Tipo do novo passo"
          onChange={(event) => setAdding(event.target.value as OnboardingStepKind)}
        >
          {(Object.keys(KIND_LABELS) as OnboardingStepKind[]).map((kind) => (
            <option key={kind} value={kind}>
              {KIND_LABELS[kind]}
            </option>
          ))}
        </select>
        <Button variant="default" size="md" disabled={disabled} onClick={add}>
          <MFIcon name="plus" size={11} /> Adicionar passo
        </Button>
      </div>
      )}
    </div>
  )
}
