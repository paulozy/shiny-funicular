'use client'

import { CSSProperties, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { T } from '@/lib/tokens'
import { apiFetch } from '@/lib/api/client'
import { OnboardingRun, OnboardingRunListResponse } from '@/lib/types/onboarding'
import { Button } from '@/components/ui/Button'

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

/**
 * "Seu onboarding" on the home sidebar: progress bar, the next pending step
 * and a way back into the flow. Renders nothing when the person has no run —
 * most people, most of the time.
 */
export function OnboardingSummaryCard() {
  const router = useRouter()
  const [run, setRun] = useState<OnboardingRun | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const response = await apiFetch<OnboardingRunListResponse>('/api/onboarding/me')
        const items = response.items ?? []
        const active = items.find((item) => item.required_remaining > 0) ?? items[0] ?? null
        if (!cancelled) setRun(active)
      } catch {
        // Silent: a dashboard card is not worth an error banner.
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  if (!run) return null

  const total = run.steps_total || 1
  const pct = Math.round((run.steps_done / total) * 100)
  const complete = run.required_remaining === 0
  const nextStep = (run.steps ?? []).find((step) => !step.status)

  const cardStyle: CSSProperties = {
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.card,
    padding: 18,
  }

  return (
    <section style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
        <h2 style={{ fontSize: 16, margin: 0 }}>Seu onboarding</h2>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 12.5, color: T.faint }}>{pct}%</span>
      </div>
      <div style={{ fontSize: 12.5, color: T.faint, marginBottom: 10 }}>
        {run.flow_name} · {run.steps_done} de {run.steps_total} passos
      </div>
      <div
        style={{
          height: 6,
          borderRadius: 99,
          background: T.neutral200,
          overflow: 'hidden',
          marginBottom: 14,
        }}
      >
        <div style={{ height: '100%', width: `${pct}%`, background: T.accent }} />
      </div>

      {complete || !nextStep ? (
        <div style={{ fontSize: 13.5, color: T.ink3 }}>
          Todos os passos obrigatórios concluídos.
        </div>
      ) : (
        <div>
          <div
            style={{
              fontSize: 11.5,
              letterSpacing: '.06em',
              textTransform: 'uppercase',
              color: T.faint,
              marginBottom: 5,
            }}
          >
            Próximo passo
          </div>
          <div style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.35 }}>{nextStep.title}</div>
          <div style={{ fontSize: 12.5, color: T.faint, marginTop: 3 }}>
            {STEP_KIND_LABELS[nextStep.kind] ?? nextStep.kind}
          </div>
          <Button
            variant="primary"
            size="sm"
            style={{ marginTop: 12 }}
            onClick={() => router.push('/onboarding')}
          >
            Continuar
          </Button>
        </div>
      )}
    </section>
  )
}
