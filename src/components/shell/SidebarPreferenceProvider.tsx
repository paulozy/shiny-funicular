'use client'

import { ReactNode, createContext, useCallback, useContext, useMemo, useState } from 'react'
import { COOKIE_SIDEBAR_STATE } from '@/lib/auth/edge-cookies'

export type SidebarMode = 'expanded' | 'collapsed'

interface SidebarPreferenceContextValue {
  mode: SidebarMode
  setMode: (next: SidebarMode) => void
}

const SidebarPreferenceContext = createContext<SidebarPreferenceContextValue>({
  mode: 'expanded',
  setMode: () => undefined,
})

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

function writeCookie(value: SidebarMode): void {
  if (typeof document === 'undefined') return
  // Non-HttpOnly so this client component can read/write it. Lax SameSite is
  // fine — this is a UI preference, not a credential. Path=/ ensures the
  // server layout reads the same value regardless of route.
  document.cookie = `${COOKIE_SIDEBAR_STATE}=${value}; Path=/; Max-Age=${ONE_YEAR_SECONDS}; SameSite=Lax`
}

interface SidebarPreferenceProviderProps {
  initialMode: SidebarMode
  children: ReactNode
}

export function SidebarPreferenceProvider({
  initialMode,
  children,
}: SidebarPreferenceProviderProps) {
  const [mode, setMode] = useState<SidebarMode>(initialMode)

  const updateMode = useCallback((next: SidebarMode) => {
    setMode(next)
    writeCookie(next)
  }, [])

  const value = useMemo(
    () => ({ mode, setMode: updateMode }),
    [mode, updateMode]
  )

  return (
    <SidebarPreferenceContext.Provider value={value}>
      {children}
    </SidebarPreferenceContext.Provider>
  )
}

export function useSidebarPreference(): SidebarPreferenceContextValue {
  return useContext(SidebarPreferenceContext)
}
