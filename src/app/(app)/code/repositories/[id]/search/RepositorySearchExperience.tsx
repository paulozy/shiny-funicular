'use client'

import { useCallback, useState } from 'react'
import { RepositoryResponse } from '@/lib/types/repository'
import { SearchInsight, SearchSynthesisDone, SearchSynthesisError, SearchSynthesisUnavailable, SemanticSearchResponse } from '@/lib/types/search'
import { SearchResultsClient } from '@/components/search/SearchResultsClient'
import { usePublishScope } from '@/components/shell/CoPensadorScopeProvider'

interface RepositorySearchExperienceProps {
  repo: RepositoryResponse
  initialQuery: string
  initialBranch: string
  initialLimit: number
  initialMinScore: number
}

/**
 * Self-contained search UI for the per-repo `search` route. The persistent
 * AppShell + RepoTabBar live in `app/(app)/code/repositories/[id]/layout.tsx`.
 *
 * The streaming `searchInsight` is published into the `CoPensadorScope`
 * context so the side panel (`<CoPensador>` in the layout) can render the
 * synthesis card without prop drilling through the layout boundary.
 */
export function RepositorySearchExperience({
  repo,
  initialQuery,
  initialBranch,
  initialLimit,
  initialMinScore,
}: RepositorySearchExperienceProps) {
  const [searchInsight, setSearchInsight] = useState<SearchInsight | null>(null)

  usePublishScope(
    { kind: 'repo-search', repoId: repo.id, query: initialQuery, insight: searchInsight },
    [repo.id, initialQuery, searchInsight]
  )

  const startInsight = useCallback((query: string) => {
    setSearchInsight({
      status: 'streaming',
      query,
      text: '',
    })
  }, [])

  const appendInsight = useCallback((text: string) => {
    setSearchInsight((current) => current ? { ...current, status: 'streaming', text: `${current.text}${text}` } : current)
  }, [])

  const setSearchResults = useCallback((response: SemanticSearchResponse) => {
    setSearchInsight((current) => current ? { ...current, results: response.results } : current)
  }, [])

  const setCachedInsight = useCallback((text: string) => {
    setSearchInsight((current) => current ? { ...current, status: 'cached', text, cached: true } : current)
  }, [])

  const setUnavailableInsight = useCallback((payload: SearchSynthesisUnavailable) => {
    setSearchInsight((current) => current ? { ...current, status: 'unavailable', reason: payload.reason } : current)
  }, [])

  const setErrorInsight = useCallback((payload: SearchSynthesisError) => {
    setSearchInsight((current) => current ? { ...current, status: 'error', reason: payload.reason } : current)
  }, [])

  const finishInsight = useCallback((payload: SearchSynthesisDone) => {
    setSearchInsight((current) => {
      if (!current) return current
      const status = payload.cached ? 'cached' : current.status === 'streaming' ? 'done' : current.status
      return {
        ...current,
        status,
        cached: payload.cached,
        tokensUsed: payload.tokens_used,
        model: payload.model,
      }
    })
  }, [])

  return (
    <SearchResultsClient
      repo={repo}
      initialQuery={initialQuery}
      initialBranch={initialBranch}
      initialLimit={initialLimit}
      initialMinScore={initialMinScore}
      onSynthesisStart={startInsight}
      onSearchResults={setSearchResults}
      onSynthesisDelta={appendInsight}
      onSynthesisComplete={setCachedInsight}
      onSynthesisUnavailable={setUnavailableInsight}
      onSynthesisError={setErrorInsight}
      onSynthesisDone={finishInsight}
    />
  )
}
