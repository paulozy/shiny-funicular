'use client'

import { CSSProperties, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { T } from '@/lib/tokens'
import { RepositoryResponse } from '@/lib/types/repository'
import { SearchSynthesisDone, SearchSynthesisError, SearchSynthesisUnavailable, SemanticSearchResponse } from '@/lib/types/search'
import { apiFetch } from '@/lib/api/client'
import { DEFAULT_MIN_SCORE, DEFAULT_SEARCH_LIMIT, buildSemanticSearchQuery, getDefaultSearchBranch, normalizeMinScore, normalizeSearchLimit } from '@/lib/search'
import { streamSemanticSearch } from '@/lib/search-stream'
import { SearchResultItem } from '@/components/search/SearchResultItem'
import { SearchSkeleton, SearchState } from '@/components/search/SearchState'
import { MFIcon } from '@/components/icons/MFIcon'

interface SearchResultsClientProps {
  repo: RepositoryResponse
  initialQuery: string
  initialBranch?: string
  initialLimit?: number
  initialMinScore?: number
  onSynthesisStart?: (query: string) => void
  onSearchResults?: (response: SemanticSearchResponse) => void
  onSynthesisDelta?: (text: string) => void
  onSynthesisComplete?: (text: string) => void
  onSynthesisUnavailable?: (payload: SearchSynthesisUnavailable) => void
  onSynthesisError?: (payload: SearchSynthesisError) => void
  onSynthesisDone?: (payload: SearchSynthesisDone) => void
}

type IndexState = 'idle' | 'queued' | 'in_progress' | 'unavailable' | 'error'

interface SearchValues {
  q: string
  branch: string
  limit: number
  minScore: number
}

export function SearchResultsClient({
  repo,
  initialQuery,
  initialBranch,
  initialLimit,
  initialMinScore,
  onSynthesisStart,
  onSearchResults,
  onSynthesisDelta,
  onSynthesisComplete,
  onSynthesisUnavailable,
  onSynthesisError,
  onSynthesisDone,
}: SearchResultsClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const didInitialSearch = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const [queryInput, setQueryInput] = useState(initialQuery.trim())
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery.trim())
  const [branch, setBranch] = useState(initialBranch || getDefaultSearchBranch(repo))
  const [searchedBranch, setSearchedBranch] = useState(initialBranch || getDefaultSearchBranch(repo))
  const [limit, setLimit] = useState(normalizeSearchLimit(initialLimit || DEFAULT_SEARCH_LIMIT))
  const [minScore, setMinScore] = useState(normalizeMinScore(initialMinScore ?? DEFAULT_MIN_SCORE))
  const [language, setLanguage] = useState('')
  const [data, setData] = useState<SemanticSearchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<{ code: string; message: string; status?: number } | null>(null)
  const [indexState, setIndexState] = useState<IndexState>('idle')
  const [indexLoading, setIndexLoading] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)

  const runSearch = useCallback(async (values: SearchValues) => {
    const q = values.q.trim()
    if (!q) {
      setData(null)
      setError(null)
      setIndexState('idle')
      setSubmittedQuery('')
      return
    }

    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller
    let receivedResults = false

    setLoading(true)
    setError(null)
    setIndexState('idle')
    setSubmittedQuery(q)
    setSearchedBranch(values.branch)
    onSynthesisStart?.(q)

    try {
      await streamSemanticSearch(
        repo.id,
        {
          q,
          branch: values.branch,
          limit: values.limit,
          min_score: values.minScore,
        },
        {
          onResults: (response) => {
            receivedResults = true
            setData(response)
            setLanguage('')
            setLoading(false)
            onSearchResults?.(response)
          },
          onTokenDelta: onSynthesisDelta,
          onSynthesis: onSynthesisComplete,
          onUnavailable: onSynthesisUnavailable,
          onError: onSynthesisError,
          onDone: onSynthesisDone,
        },
        controller.signal
      )
    } catch (err) {
      if ((err as any).name === 'AbortError') return
      if (receivedResults) {
        onSynthesisError?.({ reason: (err as Error).message || 'synthesis_stream_failed' })
        return
      }
      const code = (err as any).code || 'server_error'
      setError({
        code,
        message: (err as Error).message || 'Não foi possível buscar neste repositório.',
        status: (err as any).status,
      })
      setData(null)
      if (code === 'embeddings_unavailable') {
        setIndexState('unavailable')
      }
    } finally {
      if (!receivedResults) {
        setLoading(false)
      }
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null
      }
    }
  }, [onSearchResults, onSynthesisComplete, onSynthesisDelta, onSynthesisDone, onSynthesisError, onSynthesisStart, onSynthesisUnavailable, repo.id])

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    if (didInitialSearch.current) return
    didInitialSearch.current = true
    if (!initialQuery.trim()) return
    runSearch({
      q: initialQuery,
      branch: initialBranch || getDefaultSearchBranch(repo),
      limit: normalizeSearchLimit(initialLimit || DEFAULT_SEARCH_LIMIT),
      minScore: normalizeMinScore(initialMinScore ?? DEFAULT_MIN_SCORE),
    })
  }, [initialBranch, initialLimit, initialMinScore, initialQuery, repo, runSearch])

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

  const applySearch = (values: SearchValues) => {
    const qs = buildSemanticSearchQuery({
      q: values.q,
      branch: values.branch,
      limit: values.limit,
      min_score: values.minScore,
    })
    router.replace(`${pathname}?${qs}`)
    runSearch(values)
  }

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    applySearch({
      q: queryInput,
      branch,
      limit,
      minScore,
    })
  }

  const applyAdvancedFilters = () => {
    if (!queryInput.trim()) return
    applySearch({
      q: queryInput,
      branch,
      limit,
      minScore,
    })
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
    marginBottom: 12,
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

  const searchPanelStyle: CSSProperties = {
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.card,
    padding: 14,
    marginBottom: 14,
  }

  const searchFormStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'minmax(260px, 1fr) 180px auto',
    gap: 10,
    alignItems: 'end',
  }

  const fieldStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
    minWidth: 0,
  }

  const labelStyle: CSSProperties = {
    fontSize: 10.5,
    fontWeight: 600,
    color: T.faint,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  }

  const inputStyle: CSSProperties = {
    height: 36,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.input,
    background: T.surface,
    color: T.ink,
    font: `13px ${T.font}`,
    padding: '0 10px',
    minWidth: 0,
  }

  const queryInputStyle: CSSProperties = {
    ...inputStyle,
    fontSize: 14,
  }

  const searchButtonStyle: CSSProperties = {
    height: 36,
    border: 0,
    borderRadius: T.radius.button,
    background: T.ink,
    color: '#fff',
    font: `500 13px ${T.font}`,
    padding: '0 14px',
    cursor: loading || !queryInput.trim() ? 'not-allowed' : 'pointer',
    opacity: loading || !queryInput.trim() ? 0.65 : 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    whiteSpace: 'nowrap',
  }

  const advancedToggleStyle: CSSProperties = {
    appearance: 'none',
    border: 0,
    background: 'transparent',
    color: T.ink3,
    font: `500 12.5px ${T.font}`,
    padding: '10px 0 0',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
  }

  const advancedGridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(120px, 180px)) auto',
    gap: 10,
    alignItems: 'end',
    paddingTop: 12,
    marginTop: 12,
    borderTop: `1px solid ${T.border}`,
  }

  const secondaryButtonStyle: CSSProperties = {
    height: 32,
    border: `1px solid ${T.borderStrong}`,
    borderRadius: T.radius.button,
    background: T.surface,
    color: T.ink,
    font: `500 12.5px ${T.font}`,
    padding: '0 12px',
    cursor: loading || !queryInput.trim() ? 'not-allowed' : 'pointer',
    opacity: loading || !queryInput.trim() ? 0.65 : 1,
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
          <h1 style={titleStyle}>Busca semântica</h1>
        </div>
      </div>

      <div style={searchPanelStyle}>
        <form onSubmit={submitSearch} style={searchFormStyle} role="search" aria-label="Busca semântica no repositório">
          <label style={fieldStyle}>
            <span style={labelStyle}>Pergunte sobre este repositório</span>
            <input
              value={queryInput}
              onChange={(event) => setQueryInput(event.target.value)}
              placeholder="Ex.: onde a sessão é renovada?"
              aria-label="Pergunte sobre este repositório"
              style={queryInputStyle}
            />
          </label>

          <label style={fieldStyle}>
            <span style={labelStyle}>Branch</span>
            <input
              value={branch}
              onChange={(event) => setBranch(event.target.value)}
              aria-label="Branch"
              style={inputStyle}
            />
          </label>

          <button type="submit" disabled={loading || !queryInput.trim()} style={searchButtonStyle}>
            <MFIcon name="search" size={13} color="currentColor" />
            Buscar
          </button>
        </form>

        <button type="button" style={advancedToggleStyle} onClick={() => setAdvancedOpen((current) => !current)}>
          <MFIcon name="chevron-down" size={13} color="currentColor" />
          Filtros avançados
        </button>

        {advancedOpen && (
          <div style={advancedGridStyle}>
            <label style={fieldStyle}>
              <span style={labelStyle}>Limite</span>
              <select
                value={limit}
                onChange={(event) => setLimit(Number(event.target.value))}
                style={{ ...inputStyle, height: 32 }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </label>

            <label style={fieldStyle}>
              <span style={labelStyle}>Score mínimo</span>
              <input
                type="number"
                min={0}
                max={1}
                step={0.05}
                value={minScore}
                onChange={(event) => setMinScore(normalizeMinScore(Number(event.target.value)))}
                style={{ ...inputStyle, height: 32 }}
              />
            </label>

            <label style={fieldStyle}>
              <span style={labelStyle}>Linguagem</span>
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                style={{ ...inputStyle, height: 32 }}
              >
                <option value="">Todas</option>
                {languages.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <button type="button" onClick={applyAdvancedFilters} disabled={loading || !queryInput.trim()} style={secondaryButtonStyle}>
              Aplicar filtros
            </button>
          </div>
        )}
      </div>

      {data && (
        <div style={summaryStyle}>
          <span style={pillStyle}>{filteredResults.length} de {data.total} matches</span>
          <span style={pillStyle}>busca {submittedQuery}</span>
          <span style={pillStyle}>branch {searchedBranch}</span>
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

      {!loading && !submittedQuery && (
        <SearchState
          title="Busque neste repositório"
          description="Digite uma pergunta no campo acima para consultar o índice semântico desta branch."
        />
      )}

      {!loading && error && indexState !== 'unavailable' && (
        <SearchState
          title={error.status === 404 ? 'Repo não encontrado' : 'Não foi possível buscar'}
          description={error.message}
          actionLabel={error.status === 400 ? undefined : 'Tentar novamente'}
          onAction={
            error.status === 400
              ? undefined
              : () => runSearch({
                  q: queryInput,
                  branch,
                  limit,
                  minScore,
                })
          }
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
              result={{ ...result, branch: result.branch || searchedBranch }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
