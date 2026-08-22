'use client'

import { CSSProperties, useEffect, useState } from 'react'
import Link from 'next/link'
import { T } from '@/lib/tokens'
import { apiFetch } from '@/lib/api/client'
import { MFIcon } from '@/components/icons/MFIcon'
import { OnboardingRunListResponse } from '@/lib/types/onboarding'

/**
 * The standing invitation to continue an onboarding.
 *
 * It is a banner and not a redirect on purpose: the person can use the platform
 * freely and come back, which is how anyone senior actually learns a new
 * company. It disappears on its own once no required step is pending, so
 * finishing the flow is what removes it — nobody has to dismiss anything.
 */
export function OnboardingBanner() {
  const [pending, setPending] = useState<{ name: string; done: number; total: number } | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const response = await apiFetch<OnboardingRunListResponse>('/api/onboarding/me')
        const unfinished = (response.items ?? []).find((run) => run.required_remaining > 0)
        if (!cancelled && unfinished) {
          setPending({
            name: unfinished.flow_name,
            done: unfinished.steps_done,
            total: unfinished.steps_total,
          })
        }
      } catch {
        // A banner is not worth an error message. Someone with no onboarding —
        // most people, most of the time — should see nothing at all.
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  if (!pending) return null

  const style: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    marginBottom: 16,
    borderRadius: T.radius.card,
    border: `1px solid ${T.accentBg}`,
    background: T.accentBg,
    fontSize: 13,
  }

  return (
    <div style={style} role="status">
      <MFIcon name="flag" size={13} color={T.accent} />
      <span style={{ color: T.ink }}>
        Seu onboarding <strong>{pending.name}</strong> está em {pending.done} de {pending.total} passos.
      </span>
      <Link
        href="/onboarding"
        style={{ marginLeft: 'auto', color: T.accent, fontWeight: 600, textDecoration: 'none' }}
      >
        Continuar →
      </Link>
    </div>
  )
}
