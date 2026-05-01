'use client'

import { useCallback, useState } from 'react'
import { UserInfo } from '@/lib/types/auth'
import { OrganizationConfigResponse } from '@/lib/types/organization'
import { RepositoryListResponse, RepositoryResponse } from '@/lib/types/repository'
import { SearchInsight, SearchSynthesisDone, SearchSynthesisError, SearchSynthesisUnavailable, SemanticSearchResponse } from '@/lib/types/search'
import { AppShell } from '@/components/shell/AppShell'
import { CoPensador } from '@/components/home/CoPensador'
import { SearchResultsClient } from '@/components/search/SearchResultsClient'

interface RepositorySearchExperienceProps {
  user: UserInfo
  repo: RepositoryResponse
  repos: RepositoryListResponse
  orgConfig: OrganizationConfigResponse | null
  initialQuery: string
  initialBranch: string
  initialLimit: number
  initialMinScore: number
}

export function RepositorySearchExperience({
  user,
  repo,
  repos,
  orgConfig,
  initialQuery,
  initialBranch,
  initialLimit,
  initialMinScore,
}: RepositorySearchExperienceProps) {
  const [searchInsight, setSearchInsight] = useState<SearchInsight | null>(null)

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
    <AppShell
      user={user}
      activeHub="code"
      breadcrumb={[{ label: 'Code', href: '/' }, { label: repo.name, href: `/code/repositories/${repo.id}` }, { label: 'busca' }]}
      aiPanel={<CoPensador repos={repos} orgConfig={orgConfig} focusedRepo={repo} searchInsight={searchInsight} />}
    >
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
    </AppShell>
  )
}
