'use client'

import { CSSProperties } from 'react'
import { T } from '@/lib/tokens'

interface OnboardingProgressProps {
  done: number
  total: number
  /** Required steps still pending — what actually decides completion. */
  requiredRemaining: number
  totalMinutes?: number
}

/**
 * The progress header. It reports two different numbers on purpose: how much
 * has been read, and how much is still required. A flow can be complete with
 * optional steps untouched, and hiding that behind a single percentage would
 * make people chase 100% for no reason.
 */
export function OnboardingProgress({ done, total, requiredRemaining, totalMinutes }: OnboardingProgressProps) {
  const percent = total === 0 ? 0 : Math.round((done / total) * 100)

  const trackStyle: CSSProperties = {
    height: 6,
    borderRadius: 999,
    background: T.neutral200,
    overflow: 'hidden',
  }

  const barStyle: CSSProperties = {
    height: '100%',
    width: `${percent}%`,
    background: requiredRemaining === 0 ? T.ok : T.accent,
    transition: 'width 0.25s ease',
  }

  return (
    <div>
      <div
        style={trackStyle}
        role="progressbar"
        aria-valuenow={done}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label="Progresso do onboarding"
      >
        <div style={barStyle} />
      </div>
      <div style={{ marginTop: 6, display: 'flex', gap: 10, fontSize: 12.5, color: T.ink3, flexWrap: 'wrap' }}>
        <span>
          {done} de {total} passos
        </span>
        {requiredRemaining > 0 ? (
          <span>· {requiredRemaining} obrigatório(s) pendente(s)</span>
        ) : (
          <span style={{ color: T.ok }}>· tudo que era obrigatório está feito</span>
        )}
        {totalMinutes ? <span>· ≈{totalMinutes} min no total</span> : null}
      </div>
    </div>
  )
}
