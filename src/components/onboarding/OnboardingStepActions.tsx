'use client'

import { CSSProperties, useState } from 'react'
import { T } from '@/lib/tokens'
import { Button } from '@/components/ui/Button'
import { Tag } from '@/components/ui/Tag'
import { OnboardingRunStep, VerificationResult } from '@/lib/types/onboarding'

interface OnboardingStepActionsProps {
  step: OnboardingRunStep
  busy: boolean
  onMark: (status: 'done' | 'skipped', note?: string) => void
  onVerify: () => void
  verification?: VerificationResult
}

/**
 * The action bar, which is where the four completion modes become visible to
 * the reader:
 *
 * - `auto` / `acknowledge` — reading. The button says so.
 * - `self_reported` — the platform cannot see it happen, and the label says
 *   "marcado por você" rather than implying a check.
 * - `verified` — the platform looks, and reports what it found.
 *
 * The mode comes from the server (`completion_mode`), so this component never
 * decides which claim to make; it only renders the one it was given.
 */
export function OnboardingStepActions({ step, busy, onMark, onVerify, verification }: OnboardingStepActionsProps) {
  const [showNote, setShowNote] = useState(false)
  const [note, setNote] = useState('')

  const rowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    marginTop: 18,
    paddingTop: 14,
    borderTop: `1px solid ${T.border}`,
  }

  const hintStyle: CSSProperties = { fontSize: 12, color: T.faint }

  const done = step.status === 'done'
  const skipped = step.status === 'skipped'

  const primaryLabel = (): string => {
    switch (step.completion_mode) {
      case 'acknowledge':
        return 'Entendi'
      case 'self_reported':
        return 'Marcar como feito'
      case 'verified':
        return 'Verificar'
      default:
        return 'Marcar como lido'
    }
  }

  return (
    <div style={rowStyle}>
      {done && <Tag variant="ok">Concluído</Tag>}
      {skipped && <Tag>Pulado</Tag>}

      {step.completion_mode === 'verified' ? (
        <>
          <Button variant="primary" size="md" loading={busy} onClick={onVerify}>
            {primaryLabel()}
          </Button>
          {verification && (
            <span
              style={{
                fontSize: 12.5,
                // Pending is not a failure: the check could not run, and
                // colouring it like a rejection would be a lie.
                color: verification.passed ? T.ok : verification.pending ? T.ink3 : T.warn,
              }}
              role="status"
            >
              {verification.how}
            </span>
          )}
        </>
      ) : (
        <Button variant={done ? 'default' : 'primary'} size="md" loading={busy} onClick={() => onMark('done')}>
          {primaryLabel()}
        </Button>
      )}

      {!done && step.completion_mode !== 'verified' && (
        <Button variant="default" size="md" disabled={busy} onClick={() => setShowNote((prev) => !prev)}>
          Pular
        </Button>
      )}

      {step.completion_mode === 'self_reported' && !done && (
        <span style={hintStyle}>A plataforma não consegue conferir isso — fica marcado por você.</span>
      )}

      {step.note && <span style={hintStyle}>Sua nota: {step.note}</span>}

      {showNote && (
        <div style={{ width: '100%', display: 'flex', gap: 8, marginTop: 8 }}>
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Por que está pulando? (opcional)"
            aria-label="Motivo para pular"
            style={{
              flex: 1,
              padding: '7px 10px',
              fontSize: 13,
              fontFamily: T.font,
              border: `1px solid ${T.border}`,
              borderRadius: T.radius.input,
              background: T.surface,
              color: T.ink,
              outline: 'none',
            }}
          />
          <Button
            variant="default"
            size="md"
            loading={busy}
            onClick={() => {
              setShowNote(false)
              onMark('skipped', note.trim() || undefined)
            }}
          >
            Confirmar
          </Button>
        </div>
      )}
    </div>
  )
}
