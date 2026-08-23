'use client'

import {
  CSSProperties,
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { T } from '@/lib/tokens'

/**
 * How long a message stays up. Long enough to read a sentence twice, short
 * enough that it is gone before it becomes furniture.
 */
const TOAST_TTL_MS = 4000

interface ToastContextValue {
  /** Show a transient confirmation. Replaces whatever is on screen. */
  toast: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

/**
 * Transient feedback for actions that change something elsewhere — closing an
 * issue, approving a pull request, revoking a token.
 *
 * The v3 mockup uses one of these for roughly fifteen actions, always in the
 * same place and always as the *only* confirmation. It is deliberately not an
 * error channel: failures that need a decision belong in the surface that
 * caused them, where they can be retried.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const toast = useCallback((next: string) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setMessage(next)
    timerRef.current = setTimeout(() => setMessage(null), TOAST_TTL_MS)
  }, [])

  // A pending timer holding a setState after unmount is a React warning and a
  // small leak; clearing on unmount is the whole fix.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport message={message} />
    </ToastContext.Provider>
  )
}

/**
 * The visible strip. Rendered unconditionally so screen readers keep a stable
 * live region to announce into — swapping the element in and out can drop the
 * announcement entirely.
 */
function ToastViewport({ message }: { message: string | null }) {
  const style: CSSProperties = {
    position: 'fixed',
    bottom: 22,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 80,
    background: T.neutral900,
    color: T.bg,
    borderRadius: T.radius.card,
    padding: '11px 16px',
    fontSize: 13.5,
    boxShadow: T.shadow,
    maxWidth: 'min(560px, calc(100vw - 32px))',
    pointerEvents: 'none',
  }

  return (
    <div role="status" aria-live="polite" aria-atomic="true">
      {message && <div style={style}>{message}</div>}
    </div>
  )
}

/**
 * Access the toast channel.
 *
 * Returns a no-op outside a provider rather than throwing: a confirmation is
 * never load-bearing, and a component that renders in a context without the
 * provider (a test, a standalone story) should still work.
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  return context ?? NO_OP
}

const NO_OP: ToastContextValue = { toast: () => {} }
