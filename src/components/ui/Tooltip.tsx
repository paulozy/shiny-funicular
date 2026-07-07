'use client'

import { CSSProperties, KeyboardEvent, ReactNode, useId, useState } from 'react'
import { T } from '@/lib/tokens'

interface TooltipProps {
  /** Rich content shown inside the tooltip popover. */
  content: ReactNode
  /** The visible trigger (icon, text, etc.). Rendered inside a button. */
  children: ReactNode
  /** Which side of the trigger the popover opens on. Defaults to `bottom`. */
  placement?: 'top' | 'bottom'
  /** Popover width in pixels. Defaults to 300. */
  width?: number
  /** Accessible label for the trigger button (screen readers). */
  triggerLabel?: string
}

/**
 * Lightweight, dependency-free tooltip. Opens on hover, keyboard focus, or
 * click (for touch), and closes on mouse-leave, blur, or Escape. The popover is
 * rendered inside the hover container so moving the pointer onto it keeps it
 * open — useful for tooltips that contain links.
 */
export function Tooltip({
  content,
  children,
  placement = 'bottom',
  width = 300,
  triggerLabel,
}: TooltipProps) {
  const [open, setOpen] = useState(false)
  const id = useId()

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  const wrapperStyle: CSSProperties = {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
  }

  const triggerStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    background: 'none',
    border: 'none',
    padding: 0,
    margin: 0,
    font: 'inherit',
    color: 'inherit',
    cursor: 'pointer',
  }

  const popoverStyle: CSSProperties = {
    position: 'absolute',
    zIndex: 60,
    left: 0,
    ...(placement === 'bottom'
      ? { top: 'calc(100% + 6px)' }
      : { bottom: 'calc(100% + 6px)' }),
    width,
    maxWidth: '80vw',
    padding: '10px 12px',
    fontSize: 12,
    lineHeight: 1.55,
    fontFamily: T.font,
    fontWeight: 400,
    textAlign: 'left',
    color: T.ink2,
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.card,
    boxShadow: T.shadow,
    cursor: 'default',
  }

  return (
    <span
      style={wrapperStyle}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label={triggerLabel}
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={handleKeyDown}
        style={triggerStyle}
      >
        {children}
      </button>
      {open && (
        <span role="tooltip" id={id} style={popoverStyle}>
          {content}
        </span>
      )}
    </span>
  )
}
