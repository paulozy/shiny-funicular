'use client'

import { CSSProperties } from 'react'
import { T } from '@/lib/tokens'

export interface SegmentedOption<V extends string> {
  value: V
  label: string
}

interface SegmentedProps<V extends string> {
  /** Radio group name — must be unique on the page. */
  name: string
  options: Array<SegmentedOption<V>>
  value: V
  onChange: (value: V) => void
  ariaLabel?: string
  style?: CSSProperties
}

/**
 * The design system's `.seg` control: a joined row of radio options where the
 * selected one is filled with the accent. Used for the repository filter, the
 * documentation scope and the pull request state filter.
 *
 * Radios rather than buttons so the group is one stop in the tab order and
 * arrow keys move between options, which is what a segmented control should do.
 */
export function Segmented<V extends string>({
  name,
  options,
  value,
  onChange,
  ariaLabel,
  style,
}: SegmentedProps<V>) {
  const containerStyle: CSSProperties = {
    display: 'inline-flex',
    overflow: 'hidden',
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.button,
    ...style,
  }

  const optionStyle = (active: boolean, first: boolean): CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 12px',
    fontSize: 13,
    cursor: 'pointer',
    background: active ? T.accent : 'transparent',
    color: active ? T.inkInverse : T.ink,
    borderLeft: first ? 'none' : `1px solid ${T.border}`,
    whiteSpace: 'nowrap',
  })

  return (
    <div role="radiogroup" aria-label={ariaLabel} style={containerStyle}>
      {options.map((option, index) => {
        const active = option.value === value
        return (
          <label key={option.value} style={optionStyle(active, index === 0)}>
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={active}
              onChange={() => onChange(option.value)}
              style={{
                position: 'absolute',
                opacity: 0,
                width: 0,
                height: 0,
                pointerEvents: 'none',
              }}
            />
            {option.label}
          </label>
        )
      })}
    </div>
  )
}
