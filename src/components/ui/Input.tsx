import React, { useId, useState, CSSProperties } from 'react'
import { T } from '@/lib/tokens'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export function Input({
  label,
  error,
  hint,
  id,
  style,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false)
  const generatedId = useId()

  const inputId = id || generatedId

  // Mirrors the design system's `.input`: the focus ring is the accent border
  // itself, not a halo — v3 dropped the box-shadow.
  const inputStyle: CSSProperties = {
    width: '100%',
    minHeight: 38,
    padding: '8px 12px',
    fontSize: '14px',
    fontFamily: T.font,
    border: `1px solid ${error ? T.danger : isFocused ? T.accent : T.border}`,
    borderRadius: T.radius.input,
    backgroundColor: T.surface,
    color: T.ink,
    caretColor: T.accent,
    outline: 'none',
    transition: 'border-color 0.15s ease',
    ...(props.disabled && { opacity: 0.6, cursor: 'not-allowed' }),
    ...style,
  }

  const containerStyle: CSSProperties = {
    marginBottom: '14px',
  }

  const labelStyle: CSSProperties = {
    display: 'block',
    marginBottom: '5px',
    fontSize: '12px',
    fontWeight: 500,
    color: T.ink3,
  }

  const errorStyle: CSSProperties = {
    marginTop: '4px',
    fontSize: '12px',
    color: T.danger,
    display: 'block',
  }

  const hintStyle: CSSProperties = {
    marginTop: '4px',
    fontSize: '11.5px',
    color: T.faint,
    display: 'block',
  }

  return (
    <div style={containerStyle}>
      {label && <label htmlFor={inputId} style={labelStyle}>{label}</label>}
      <input
        {...props}
        id={inputId}
        style={inputStyle}
        onFocus={(e) => {
          setIsFocused(true)
          props.onFocus?.(e)
        }}
        onBlur={(e) => {
          setIsFocused(false)
          props.onBlur?.(e)
        }}
      />
      {error && <span style={errorStyle}>{error}</span>}
      {hint && !error && <span style={hintStyle}>{hint}</span>}
    </div>
  )
}
