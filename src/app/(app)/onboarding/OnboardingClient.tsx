'use client'

import { CSSProperties, useCallback, useEffect, useMemo, useState } from 'react'
import { AppShell } from '@/components/shell/AppShell'
import { T } from '@/lib/tokens'
import { apiFetch } from '@/lib/api/client'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Tag } from '@/components/ui/Tag'
import { UserInfo } from '@/lib/types/auth'
import {
  OnboardingRun,
  OnboardingRunListResponse,
  OnboardingRunStep,
  VerificationResult,
} from '@/lib/types/onboarding'
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress'
import { OnboardingStepActions } from '@/components/onboarding/OnboardingStepActions'
import { OnboardingStepBody } from '@/components/onboarding/OnboardingStepBody'

const STEP_KIND_LABELS: Record<string, string> = {
  markdown: 'leitura',
  repository: 'repositório',
  team: 'time',
  doc: 'documentação',
  architecture: 'arquitetura',
  glossary: 'glossário',
  contacts: 'pessoas',
  checklist: 'checklist',
  link: 'link',
  verified: 'verificação',
  task: 'tarefa',
}

interface OnboardingClientProps {
  user: UserInfo
  initialRuns: OnboardingRun[]
}

/**
 * The runner: a rail of steps on the left, the current one on the right.
 *
 * Navigation is free — clicking any step opens it. Progress is per step, so
 * nothing breaks by reading out of order, and forcing a sequence would only
 * annoy the person who already knows half of it.
 */
export function OnboardingClient({ user, initialRuns }: OnboardingClientProps) {
  const [runs, setRuns] = useState<OnboardingRun[]>(initialRuns)
  const [activeRunIndex, setActiveRunIndex] = useState(0)
  const [activeStepId, setActiveStepId] = useState<string | null>(
    initialRuns[0]?.steps.find((step) => !step.status)?.id ?? initialRuns[0]?.steps[0]?.id ?? null
  )
  const [busyStepId, setBusyStepId] = useState<string | null>(null)
  const [verifications, setVerifications] = useState<Record<string, VerificationResult>>({})
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState('')
  const [feedbackSent, setFeedbackSent] = useState(false)

  const run = runs[activeRunIndex]

  const activeStep: OnboardingRunStep | undefined = useMemo(() => {
    if (!run) return undefined
    return run.steps.find((step) => step.id === activeStepId) ?? run.steps[0]
  }, [run, activeStepId])

  const reload = useCallback(async () => {
    try {
      const response = await apiFetch<OnboardingRunListResponse>('/api/onboarding/me')
      setRuns(response.items ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao recarregar o onboarding.')
    }
  }, [])

  useEffect(() => {
    if (initialRuns.length === 0) {
      void reload()
    }
  }, [initialRuns.length, reload])

  const advance = (currentId: string) => {
    if (!run) return
    const index = run.steps.findIndex((step) => step.id === currentId)
    const next = run.steps[index + 1]
    if (next) setActiveStepId(next.id)
  }

  const markStep = async (step: OnboardingRunStep, status: 'done' | 'skipped', note?: string) => {
    setBusyStepId(step.id)
    setError(null)
    try {
      const updated = await apiFetch<OnboardingRun>(`/api/onboarding/me/steps/${step.id}`, {
        method: 'POST',
        body: JSON.stringify({ status, note }),
      })
      // The server returns the whole run, so counts and derived completion come
      // back consistent instead of being recomputed here.
      setRuns((prev) => prev.map((item, index) => (index === activeRunIndex ? updated : item)))
      advance(step.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar este passo.')
    } finally {
      setBusyStepId(null)
    }
  }

  const verifyStep = async (step: OnboardingRunStep) => {
    setBusyStepId(step.id)
    setError(null)
    try {
      const result = await apiFetch<VerificationResult>(`/api/onboarding/me/steps/${step.id}/verify`, {
        method: 'POST',
      })
      setVerifications((prev) => ({ ...prev, [step.id]: result }))
      // Only a pass changes stored state, so only a pass needs a reload.
      if (result.passed) await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível verificar agora.')
    } finally {
      setBusyStepId(null)
    }
  }

  const sendFeedback = async () => {
    if (!run || !feedback.trim()) return
    try {
      await apiFetch(`/api/onboarding/me/assignments/${run.assignment_id}/feedback`, {
        method: 'POST',
        body: JSON.stringify({ feedback: feedback.trim() }),
      })
      setFeedbackSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível enviar seu retorno.')
    }
  }

  const pageStyle: CSSProperties = {}
  const layoutStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '280px minmax(0, 1fr)',
    gap: 26,
    alignItems: 'start',
  }
  const railStyle: CSSProperties = {
    display: 'grid',
    gap: 2,
    alignContent: 'start',
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.card,
    padding: 10,
    position: 'sticky',
    // Clears the shell header (56 identity + 40 hubs + 40 section tabs).
    top: 152,
  }
  const panelStyle: CSSProperties = {
    padding: '18px 20px',
    borderRadius: T.radius.card,
    border: `1px solid ${T.border}`,
    background: T.surface,
  }

  const railItemStyle = (step: OnboardingRunStep, active: boolean): CSSProperties => ({
    display: 'flex',
    alignItems: 'flex-start',
    gap: 11,
    padding: '10px 11px',
    borderRadius: T.radius.tag,
    border: 0,
    background: active ? T.accentBg : 'transparent',
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
    fontFamily: T.font,
    fontSize: 13.5,
    lineHeight: 1.35,
    color: step.status === 'done' ? T.ink3 : T.ink,
  })

  const railMarkStyle = (step: OnboardingRunStep): CSSProperties => ({
    width: 22,
    height: 22,
    borderRadius: '50%',
    background: step.status === 'done' ? T.accent : 'transparent',
    border: `1px solid ${step.status === 'done' ? T.accent : T.border}`,
    color: step.status === 'done' ? T.inkInverse : T.faint,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11.5,
    fontWeight: 600,
    flexShrink: 0,
  })

  if (!run) {
    return (
      <AppShell user={user} activeHub="code" codeTab="onboarding">
        <div style={pageStyle}>
          <h1 style={{ fontSize: 26, marginBottom: 8 }}>Nenhum onboarding atribuído</h1>
          <p style={{ fontSize: 13.5, color: T.ink3, maxWidth: 560 }}>
            Quando alguém te atribuir um fluxo — no convite ou depois — ele aparece aqui. Um admin pode montar
            fluxos em Configurações → Onboarding.
          </p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell user={user} activeHub="code" codeTab="onboarding">
      <div style={pageStyle}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 24,
            flexWrap: 'wrap',
            marginBottom: 22,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11.5,
                letterSpacing: '.08em',
                textTransform: 'uppercase',
                color: T.faint,
              }}
            >
              Meu onboarding
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
              <h1 style={{ fontSize: 26, margin: 0 }}>{run.flow_name}</h1>
              {run.status === 'completed' && <Tag variant="ok">Concluído</Tag>}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 220, maxWidth: 420 }}>
            <OnboardingProgress
              done={run.steps_done}
              total={run.steps_total}
              requiredRemaining={run.required_remaining}
              totalMinutes={run.total_minutes}
            />
          </div>
        </div>

        {run.flow_summary && (
          <p style={{ fontSize: 14, color: T.ink3, margin: '0 0 18px', maxWidth: '70ch' }}>
            {run.flow_summary}
          </p>
        )}

        {runs.length > 1 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {runs.map((item, index) => (
              <Button
                key={item.assignment_id}
                variant={index === activeRunIndex ? 'primary' : 'default'}
                size="sm"
                onClick={() => {
                  setActiveRunIndex(index)
                  setActiveStepId(item.steps.find((step) => !step.status)?.id ?? item.steps[0]?.id ?? null)
                }}
              >
                {item.flow_name}
              </Button>
            ))}
          </div>
        )}

        {error && (
          <div style={{ marginBottom: 14 }}>
            <Alert variant="danger">{error}</Alert>
          </div>
        )}

        <div style={layoutStyle}>
          <nav style={railStyle} aria-label="Passos do onboarding">
            {run.steps.map((step, index) => (
              <button
                key={step.id}
                type="button"
                style={railItemStyle(step, step.id === activeStep?.id)}
                onClick={() => setActiveStepId(step.id)}
                aria-current={step.id === activeStep?.id}
              >
                <span style={railMarkStyle(step)} aria-hidden="true">
                  {step.status === 'done' ? '✓' : step.status === 'skipped' ? '–' : index + 1}
                </span>
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span
                    style={{
                      display: 'block',
                      fontWeight: step.id === activeStep?.id ? 600 : 500,
                    }}
                  >
                    {step.title}
                  </span>
                  <span style={{ display: 'block', fontSize: 11.5, color: T.faint, marginTop: 2 }}>
                    {STEP_KIND_LABELS[step.kind] ?? step.kind}
                    {step.is_required && !step.status ? ' · obrigatório' : ''}
                  </span>
                </span>
              </button>
            ))}
          </nav>

          <section style={panelStyle}>
            {activeStep && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: 17, fontWeight: 600, margin: 0 }}>{activeStep.title}</h2>
                  {activeStep.is_required ? <Tag variant="warn">obrigatório</Tag> : <Tag>opcional</Tag>}
                  {activeStep.completion_mode === 'verified' && <Tag variant="accent">verificado</Tag>}
                  {activeStep.estimated_minutes ? <Tag>≈{activeStep.estimated_minutes} min</Tag> : null}
                </div>
                <div style={{ marginTop: 14 }}>
                  <OnboardingStepBody step={activeStep} />
                </div>
                <OnboardingStepActions
                  step={activeStep}
                  busy={busyStepId === activeStep.id}
                  onMark={(status, note) => void markStep(activeStep, status, note)}
                  onVerify={() => void verifyStep(activeStep)}
                  verification={verifications[activeStep.id]}
                />
              </>
            )}
          </section>
        </div>

        {/* The closing question. The newcomer is the only person who knows what
            was missing, and in two weeks they will have forgotten they didn't
            know — so it is asked here, at the end, not in a retrospective. */}
        {run.required_remaining === 0 && !run.feedback && !feedbackSent && (
          <section style={{ ...panelStyle, marginTop: 20 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 6px' }}>O que faltou?</h2>
            <p style={{ fontSize: 13, color: T.ink3, margin: '0 0 10px' }}>
              Você é a única pessoa que sabe o que este onboarding não explicou. Isso vai para quem mantém o fluxo.
            </p>
            <textarea
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              rows={3}
              aria-label="Seu retorno sobre o onboarding"
              style={{
                width: '100%',
                padding: '8px 10px',
                fontSize: 13,
                fontFamily: T.font,
                border: `1px solid ${T.border}`,
                borderRadius: T.radius.input,
                background: T.surface,
                color: T.ink,
                resize: 'vertical',
              }}
            />
            <div style={{ marginTop: 10 }}>
              <Button variant="primary" size="md" disabled={!feedback.trim()} onClick={() => void sendFeedback()}>
                Enviar
              </Button>
            </div>
          </section>
        )}

        {(run.feedback || feedbackSent) && (
          <div style={{ marginTop: 20 }}>
            <Alert variant="ok">Obrigado — seu retorno foi registrado.</Alert>
          </div>
        )}
      </div>
    </AppShell>
  )
}
