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

  const inputStyle: CSSProperties = {
    width: '100%',
    padding: '7px 10px',
    fontSize: '13px',
    fontFamily: T.font,
    border: `1px solid ${error ? T.danger : isFocused ? T.ink : T.border}`,
    borderRadius: T.radius.input,
    backgroundColor: T.surface,
    color: T.ink,
    outline: 'none',
    transition: 'all 0.15s ease',
    boxShadow: isFocused
      ? error
        ? `0 0 0 3px rgba(184, 65, 59, 0.1)`
        : `0 0 0 3px rgba(0, 0, 0, 0.06)`
      : 'none',
    ...(props.disabled && { opacity: 0.6, cursor: 'not-allowed' }),
    ...style,
  }

  const containerStyle: CSSProperties = {
    marginBottom: '14px',
  }

  const labelStyle: CSSProperties = {
    display: 'block',
    marginBottom: '4px',
    fontSize: '12.5px',
    fontWeight: 500,
    color: T.ink,
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
