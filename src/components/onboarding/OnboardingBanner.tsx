'use client'

import { CSSProperties, useEffect, useState } from 'react'
import Link from 'next/link'
import { T } from '@/lib/tokens'
import { apiFetch } from '@/lib/api/client'
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
    gap: 12,
    padding: '11px 14px',
    marginBottom: 22,
    borderRadius: T.radius.card,
    background: T.accentBg,
    fontSize: 13.5,
  }

  return (
    <div style={style} role="status">
      <span
        aria-hidden="true"
        style={{ width: 7, height: 7, borderRadius: '50%', background: T.accent, flexShrink: 0 }}
      />
      <span style={{ color: T.ink }}>
        Seu onboarding <strong>{pending.name}</strong> está em {pending.done} de {pending.total} passos.
      </span>
      <Link
        href="/onboarding"
        style={{ marginLeft: 'auto', color: T.accent700, fontWeight: 600, textDecoration: 'none', fontSize: 13 }}
      >
        Continuar →
      </Link>
    </div>
  )
}
