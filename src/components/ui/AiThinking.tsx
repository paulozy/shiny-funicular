'use client'

import { CSSProperties, useEffect, useState } from 'react'
import { T } from '@/lib/tokens'
import { AISpark } from '@/components/icons/MFIcon'

interface AiThinkingProps {
  /**
   * Messages to cycle through. They should be ordered so each one feels like
   * progress over the previous one ("collecting" → "synthesizing" → "almost
   * done"), not random. The component **stops** on the last message instead
   * of looping — looping feels dishonest after the user has noticed the
   * cycle.
   */
  messages?: string[]
  /** Time between message swaps. Default 6s is comfortable for analyses that
   *  typically resolve in 5-30s. */
  intervalMs?: number
  /** When true, renders 3 skeleton rows below the message. Default true. */
  showSkeleton?: boolean
}

const DEFAULT_MESSAGES = [
  'Coletando análises do repositório…',
  'Sintetizando alertas com a IA…',
  'Quase lá, organizando insights…',
  'Análises complexas levam um pouco mais — obrigado pela paciência',
]

export function AiThinking({
  messages = DEFAULT_MESSAGES,
  intervalMs = 6000,
  showSkeleton = true,
}: AiThinkingProps) {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    if (messages.length <= 1) return
    const id = setInterval(() => {
      setIdx((current) => Math.min(current + 1, messages.length - 1))
    }, intervalMs)
    return () => clearInterval(id)
  }, [messages.length, intervalMs])

  const wrapStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    padding: '32px 0 16px',
  }

  const headlineStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 14,
    color: T.ink,
    fontWeight: 500,
  }

  const dotStyle = (delay: string): CSSProperties => ({
    display: 'inline-block',
    width: 5,
    height: 5,
    borderRadius: '50%',
    background: T.accent,
    animation: 'ai-thinking-pulse 1.1s ease-in-out infinite',
    animationDelay: delay,
  })

  const messageStyle: CSSProperties = {
    transition: 'opacity 200ms ease-in-out',
  }

  const skeletonStyle = (width: string): CSSProperties => ({
    height: 14,
    width,
    borderRadius: 4,
    background: T.surfaceAlt,
    backgroundImage: `linear-gradient(90deg, transparent 0%, ${T.surface} 40%, ${T.surface} 60%, transparent 100%)`,
    backgroundSize: '200% 100%',
    animation: 'ai-thinking-shimmer 1.6s linear infinite',
  })

  return (
    <div style={wrapStyle} role="status" aria-live="polite" aria-label="Carregando">
      <div style={headlineStyle}>
        <AISpark size={16} />
        <span key={idx} style={messageStyle}>
          {messages[idx]}
        </span>
        <span style={{ display: 'inline-flex', gap: 3, marginLeft: 4 }}>
          <span style={dotStyle('0s')} />
          <span style={dotStyle('0.18s')} />
          <span style={dotStyle('0.36s')} />
        </span>
      </div>

      {showSkeleton && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={skeletonStyle('72%')} />
          <div style={skeletonStyle('88%')} />
          <div style={skeletonStyle('60%')} />
          <div style={skeletonStyle('80%')} />
        </div>
      )}
    </div>
  )
}
