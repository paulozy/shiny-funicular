'use client'

import { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { T } from '@/lib/tokens'
import { RepositoryResponse } from '@/lib/types/repository'
import { SemanticSearchResponse } from '@/lib/types/search'
import { apiFetch } from '@/lib/api/client'
import { DEFAULT_MIN_SCORE, DEFAULT_SEARCH_LIMIT, buildSemanticSearchQuery, getDefaultSearchBranch, normalizeMinScore, normalizeSearchLimit } from '@/lib/search'
import { SearchFilters } from '@/components/search/SearchFilters'
import { SearchResultItem } from '@/components/search/SearchResultItem'
import { SearchSkeleton, SearchState } from '@/components/search/SearchState'

interface SearchResultsClientProps {
  repo: RepositoryResponse
  initialQuery: string
  initialBranch?: string
  initialLimit?: number
  initialMinScore?: number
}

type IndexState = 'idle' | 'queued' | 'in_progress' | 'unavailable' | 'error'

export function SearchResultsClient({
  repo,
  initialQuery,
  initialBranch,
  initialLimit,
  initialMinScore,
}: SearchResultsClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const didInitialSearch = useRef(false)
  const [query] = useState(initialQuery.trim())
  const [branch, setBranch] = useState(initialBranch || getDefaultSearchBranch(repo))
  const [limit, setLimit] = useState(normalizeSearchLimit(initialLimit || DEFAULT_SEARCH_LIMIT))
  const [minScore, setMinScore] = useState(normalizeMinScore(initialMinScore ?? DEFAULT_MIN_SCORE))
  const [language, setLanguage] = useState('')
  const [data, setData] = useState<SemanticSearchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<{ code: string; message: string; status?: number } | null>(null)
  const [indexState, setIndexState] = useState<IndexState>('idle')
  const [indexLoading, setIndexLoading] = useState(false)

  const runSearch = useCallback(async () => {
    if (!query) {
      setError({
        code: 'invalid_request',
        message: 'Informe uma busca para pesquisar neste repositório.',
        status: 400,
      })
      setData(null)
      return
    }

    setLoading(true)
    setError(null)
    setIndexState('idle')

    try {
      const qs = buildSemanticSearchQuery({
        q: query,
        branch,
        limit,
        min_score: minScore,
      })
      const response = await apiFetch<SemanticSearchResponse>(`/api/repositories/${repo.id}/search?${qs}`)
      setData(response)
      setLanguage('')
    } catch (err) {
      const code = (err as any).code || 'server_error'
      setError({
        code,
        message: (err as Error).message || 'Não foi possível buscar neste repositório.',
      })
      setData(null)
      if (code === 'embeddings_unavailable') {
        setIndexState('unavailable')
      }
    } finally {
      setLoading(false)
    }
  }, [branch, limit, minScore, query, repo.id])

  useEffect(() => {
    if (didInitialSearch.current) return
    didInitialSearch.current = true
    runSearch()
  }, [runSearch])

  const languages = useMemo(() => {
    const values = new Set<string>()
    data?.results.forEach((result) => {
      if (result.language) values.add(result.language)
    })
    return Array.from(values).sort((a, b) => a.localeCompare(b))
  }, [data])

  const filteredResults = useMemo(() => {
    if (!data) return []
    if (!language) return data.results
    return data.results.filter((result) => result.language === language)
  }, [data, language])

  const applyFilters = () => {
    const qs = buildSemanticSearchQuery({
      q: query,
      branch,
      limit,
      min_score: minScore,
    })
    router.replace(`${pathname}?${qs}`)
    runSearch()
  }

  const generateEmbeddings = async () => {
    setIndexLoading(true)
    setIndexState('idle')
    try {
      await apiFetch(`/api/repositories/${repo.id}/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branch }),
      })
      setIndexState('queued')
    } catch (err) {
      const code = (err as any).code || 'server_error'
      if (code === 'embeddings_in_progress') {
        setIndexState('in_progress')
      } else if (code === 'embeddings_unavailable') {
        setIndexState('unavailable')
      } else {
        setIndexState('error')
      }
    } finally {
      setIndexLoading(false)
    }
  }

  const pageStyle: CSSProperties = {
    padding: '20px 24px 28px',
  }

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 16,
    marginBottom: 14,
  }

  const eyebrowStyle: CSSProperties = {
    fontSize: 10.5,
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: T.faint,
    marginBottom: 4,
  }

  const titleStyle: CSSProperties = {
    margin: 0,
    fontSize: 22,
    fontWeight: 600,
    color: T.ink,
  }

  const summaryStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    fontSize: 12,
    color: T.ink3,
    marginBottom: 14,
  }

  const pillStyle: CSSProperties = {
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.tag,
    padding: '2px 8px',
    background: T.surface,
    color: T.ink2,
  }

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <div style={eyebrowStyle}>{repo.full_name}</div>
          <h1 style={titleStyle}>{query ? `Busca: ${query}` : 'Busca semântica'}</h1>
        </div>
      </div>

      <SearchFilters
        branch={branch}
        limit={limit}
        minScore={minScore}
        language={language}
        languages={languages}
        loading={loading}
        onBranchChange={setBranch}
        onLimitChange={setLimit}
        onMinScoreChange={(value) => setMinScore(normalizeMinScore(value))}
        onLanguageChange={setLanguage}
        onApply={applyFilters}
      />

      {data && (
        <div style={summaryStyle}>
          <span style={pillStyle}>{filteredResults.length} de {data.total} matches</span>
          <span style={pillStyle}>branch {branch}</span>
          <span style={pillStyle}>repo {repo.name}</span>
          <span style={pillStyle}>ordenado por relevância</span>
        </div>
      )}

      {indexState === 'queued' && (
        <SearchState
          title="Indexação na fila"
          description="O índice semântico foi solicitado para esta branch. Tente novamente quando o processamento terminar."
        />
      )}

      {indexState === 'in_progress' && (
        <SearchState
          title="Indexação em andamento"
          description="Já existe uma geração de embeddings em execução para este repositório e branch."
        />
      )}

      {indexState === 'unavailable' && (
        <SearchState
          title="Provider de embeddings não configurado"
          description="Configure a Voyage API key nas configurações da organização para gerar índices e executar busca semântica."
        />
      )}

      {indexState === 'error' && (
        <SearchState
          title="Não foi possível gerar o índice"
          description="Tente novamente em alguns instantes."
          actionLabel="Tentar novamente"
          loading={indexLoading}
          onAction={generateEmbeddings}
        />
      )}

      {loading && <SearchSkeleton />}

      {!loading && error && indexState !== 'unavailable' && (
        <SearchState
          title={error.status === 404 ? 'Repo não encontrado' : 'Não foi possível buscar'}
          description={error.message}
          actionLabel={error.status === 400 ? undefined : 'Tentar novamente'}
          onAction={error.status === 400 ? undefined : runSearch}
        />
      )}

      {!loading && !error && data && filteredResults.length === 0 && (
        <SearchState
          title="Nenhum trecho encontrado para essa busca neste repo"
          description="Tente reduzir o score mínimo, mudar a branch, ajustar os termos ou gerar/regerar o índice semântico."
          actionLabel="Gerar índice semântico"
          loading={indexLoading}
          onAction={generateEmbeddings}
        />
      )}

      {!loading && !error && filteredResults.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredResults.map((result, index) => (
            <SearchResultItem
              key={`${result.file_path}-${result.start_line || 0}-${index}`}
              repoId={repo.id}
              result={{ ...result, branch: result.branch || branch }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
