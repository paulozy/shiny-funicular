'use client'

import { CSSProperties, useEffect, useRef, useState } from 'react'
import { T } from '@/lib/tokens'
import { MFIcon } from '@/components/icons/MFIcon'
import { copyText } from '@/lib/clipboard'

interface CopyButtonProps {
  /** Text placed on the clipboard. */
  text: string
  /** Idle label + accessible name. Defaults to "Copiar". */
  label?: string
  /** Called with `announceLabel ?? label` on a successful copy — use it to push
   *  a message into a shared aria-live region for screen readers. */
  onCopied?: (announced: string) => void
  announceLabel?: string
}

export function CopyButton({ text, label = 'Copiar', onCopied, announceLabel }: CopyButtonProps) {
  const [state, setState] = useState<'idle' | 'copied' | 'error'>('idle')
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [])

  const handleClick = async () => {
    const ok = await copyText(text)
    setState(ok ? 'copied' : 'error')
    if (ok) onCopied?.(announceLabel ?? label)
    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => setState('idle'), 1800)
  }

  const style: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '3px 8px',
    minHeight: 24,
    fontSize: 11.5,
    fontWeight: 600,
    fontFamily: T.font,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.button,
    background: T.surface,
    color: state === 'error' ? T.danger : state === 'copied' ? T.ok : T.ink2,
    cursor: 'pointer',
  }

  const visibleLabel = state === 'copied' ? 'Copiado' : state === 'error' ? 'Falhou' : label
  const icon = state === 'copied' ? 'check' : state === 'error' ? 'x' : 'doc'

  return (
    <button type="button" onClick={handleClick} aria-label={label} style={style}>
      <MFIcon name={icon} size={12} color="currentColor" />
      {visibleLabel}
    </button>
  )
}
