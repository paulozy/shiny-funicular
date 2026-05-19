'use client'

import { CSSProperties, useState } from 'react'
import Link from 'next/link'
import { T } from '@/lib/tokens'
import { EmbeddingsState } from '@/lib/types/repository'
import { Button } from '@/components/ui/Button'
import { MFIcon } from '@/components/icons/MFIcon'

interface EmbeddingsActionButtonProps {
  state: EmbeddingsState | undefined
  onTrigger: () => Promise<void>
  /**
   * Optional fallback used when state is undefined (i.e. backend hasn't been
   * upgraded yet). When provided it controls whether the button shows the
   * disabled "Sem provedor" treatment.
   */
  fallbackProviderConfigured?: boolean
  /** Compact variant (used in search empty-states). */
  size?: 'sm' | 'md'
}

interface ButtonShape {
  label: string
  variant: 'primary' | 'default'
  icon: string
  disabled?: boolean
  showAlert?: boolean
}

function buttonShape(state: EmbeddingsState | undefined, fallbackProviderOK: boolean): ButtonShape {
  const status = state?.status ?? 'idle'
  const providerOK = state ? state.provider_configured : fallbackProviderOK

  if (!providerOK) {
    return {
      label: 'Provedor não configurado',
      variant: 'default',
      icon: 'lock',
      disabled: true,
    }
  }

  switch (status) {
    case 'pending':
    case 'indexing':
      return {
        label: 'Indexando…',
        variant: 'default',
        icon: 'sparkles',
        disabled: true,
      }
    case 'indexed':
      return {
        label: 'Atualizar referências',
        variant: 'default',
        icon: 'database',
      }
    case 'stale':
      return {
        label: 'Atualizar referências',
        variant: 'primary',
        icon: 'database',
        showAlert: true,
      }
    case 'failed':
      return {
        label: 'Tentar novamente',
        variant: 'primary',
        icon: 'database',
      }
    case 'idle':
    default:
      return {
        label: 'Indexar código',
        variant: 'primary',
        icon: 'sparkles',
      }
  }
}

export function EmbeddingsActionButton({
  state,
  onTrigger,
  fallbackProviderConfigured = false,
  size = 'md',
}: EmbeddingsActionButtonProps) {
  const shape = buttonShape(state, fallbackProviderConfigured)
  const [busy, setBusy] = useState(false)

  // When the provider isn't configured, render a disabled button alongside a
  // small link sending the user to the org settings. We avoid hiding the
  // affordance entirely so the user understands *why* nothing is indexed.
  if (shape.disabled && shape.icon === 'lock') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <Button variant="default" size={size} disabled title="Configure o provedor de embeddings em Ajustes da Organização">
          <MFIcon name="lock" size={11} />
          {shape.label}
        </Button>
        <Link
          href="/settings"
          style={{ fontSize: 11.5, color: T.accent, textDecoration: 'underline' }}
          aria-label="Abrir configurações da organização"
        >
          configurar →
        </Link>
      </span>
    )
  }

  const handleClick = async () => {
    if (busy || shape.disabled) return
    setBusy(true)
    try {
      await onTrigger()
    } finally {
      setBusy(false)
    }
  }

  const alertDotStyle: CSSProperties = {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: T.warn,
    marginRight: 2,
  }

  return (
    <Button
      variant={shape.variant}
      size={size}
      onClick={handleClick}
      loading={busy}
      disabled={shape.disabled}
    >
      {shape.showAlert && <span style={alertDotStyle} aria-hidden="true" />}
      <MFIcon name={shape.icon} size={11} />
      {shape.label}
    </Button>
  )
}
