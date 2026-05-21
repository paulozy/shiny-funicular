'use client'

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { SearchInsight } from '@/lib/types/search'

/**
 * Discriminated union describing what the CoPensador side panel should be
 * showing. Each client route publishes the relevant scope on mount via the
 * `useCoPensadorScope` hook so the panel — which lives in the persistent
 * `(app)` layout — can render the right insights without depending on
 * page-level prop drilling.
 */
export type CoPensadorScope =
  | { kind: 'org' }
  | { kind: 'repo-overview'; repoId: string }
  | { kind: 'repo-issues'; repoId: string; analysisId?: string }
  | { kind: 'repo-search'; repoId: string; query?: string; insight?: SearchInsight | null }
  | { kind: 'repo-pulls'; repoId: string }
  | { kind: 'repo-files'; repoId: string }

interface ScopeContextValue {
  scope: CoPensadorScope | null
  setScope: (scope: CoPensadorScope | null) => void
}

const Ctx = createContext<ScopeContextValue | null>(null)

export function CoPensadorScopeProvider({ children }: { children: ReactNode }) {
  const [scope, setScopeState] = useState<CoPensadorScope | null>(null)
  const setScope = useCallback((next: CoPensadorScope | null) => setScopeState(next), [])
  return <Ctx.Provider value={{ scope, setScope }}>{children}</Ctx.Provider>
}

const NOOP_VALUE: ScopeContextValue = {
  scope: null,
  setScope: () => {
    // No-op. Useful so components rendered outside the provider (tests,
    // Storybook, isolated previews) don't crash; they simply ignore scope
    // updates. The provider is always present in the real (app) tree.
  },
}

export function useCoPensadorScope(): ScopeContextValue {
  const value = useContext(Ctx)
  return value ?? NOOP_VALUE
}

/**
 * Convenience hook that publishes the scope on mount and clears it on unmount.
 * The dependency array is the caller's responsibility — pass values that, when
 * they change, should re-publish the scope (e.g. `searchInsight`).
 */
export function usePublishScope(scope: CoPensadorScope, deps: ReadonlyArray<unknown> = []) {
  const { setScope } = useCoPensadorScope()
  useEffect(() => {
    setScope(scope)
    return () => setScope(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
