import React, { CSSProperties } from 'react'
import { T } from '@/lib/tokens'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  label?: string
}

export function Toggle({ checked, onChange, disabled = false, label }: ToggleProps) {
  const trackStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: checked ? T.accent : T.border,
    cursor: disabled ? 'not-allowed' : 'pointer',
    padding: 2,
    transition: 'background-color 200ms ease-in-out',
    opacity: disabled ? 0.5 : 1,
  }

  const thumbStyle: CSSProperties = {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: T.surface,
    transform: checked ? 'translateX(20px)' : 'translateX(0)',
    transition: 'transform 200ms ease-in-out',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  }

  const containerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  }

  const labelStyle: CSSProperties = {
    fontSize: 13,
    fontWeight: 500,
    color: T.ink2,
    userSelect: 'none',
  }

  return (
    <div style={containerStyle}>
      <button
        type="button"
        style={trackStyle}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        aria-pressed={checked}
      >
        <div style={thumbStyle} />
      </button>
      {label && <label style={labelStyle}>{label}</label>}
    </div>
  )
}
