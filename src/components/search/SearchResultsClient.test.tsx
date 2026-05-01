import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { SearchResultsClient } from '@/components/search/SearchResultsClient'
import { apiFetch } from '@/lib/api/client'
import { streamSemanticSearch } from '@/lib/search-stream'
import { RepositoryResponse } from '@/lib/types/repository'

const replace = jest.fn()

jest.mock('next/navigation', () => ({
  usePathname: () => '/code/repositories/repo-1/search',
  useRouter: () => ({ replace }),
}))

jest.mock('@/lib/api/client', () => ({
  apiFetch: jest.fn(),
}))

jest.mock('@/lib/search-stream', () => ({
  streamSemanticSearch: jest.fn(),
}))

const repo: RepositoryResponse = {
  id: 'repo-1',
  name: 'web',
  full_name: 'org/web',
  url: 'https://github.com/org/web',
  provider: 'github',
  is_private: false,
  metadata: { default_branch: 'main' },
  organization_id: 'org-1',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

describe('SearchResultsClient', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(apiFetch as jest.Mock).mockResolvedValue({})
    ;(streamSemanticSearch as jest.Mock).mockImplementation(async (_repoId, _params, handlers) => {
      handlers.onResults?.({
        query: 'auth',
        total: 0,
        results: [],
      })
      handlers.onDone?.({ cached: false, tokens_used: 12, model: 'claude' })
    })
  })

  it('shows the central search prompt without running an empty search', () => {
    render(<SearchResultsClient repo={repo} initialQuery="" initialBranch="main" />)

    expect(screen.getByRole('search', { name: /busca semântica no repositório/i })).toBeInTheDocument()
    expect(screen.getByText(/busque neste repositório/i)).toBeInTheDocument()
    expect(streamSemanticSearch).not.toHaveBeenCalled()
  })

  it('runs semantic search from the central search field', async () => {
    const onSynthesisStart = jest.fn()
    const onSynthesisDone = jest.fn()
    render(<SearchResultsClient repo={repo} initialQuery="" initialBranch="main" onSynthesisStart={onSynthesisStart} onSynthesisDone={onSynthesisDone} />)

    fireEvent.change(screen.getByLabelText(/pergunte sobre este repositório/i), {
      target: { value: 'auth token' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^buscar$/i }))

    await waitFor(() => {
      expect(streamSemanticSearch).toHaveBeenCalledWith(
        'repo-1',
        { q: 'auth token', branch: 'main', limit: 10, min_score: 0.55 },
        expect.any(Object),
        expect.any(AbortSignal)
      )
    })
    expect(replace).toHaveBeenCalledWith('/code/repositories/repo-1/search?q=auth+token&limit=10&branch=main&min_score=0.55')
    expect(onSynthesisStart).toHaveBeenCalledWith('auth token')
    expect(onSynthesisDone).toHaveBeenCalledWith({ cached: false, tokens_used: 12, model: 'claude' })
  })

  it('keeps advanced filters collapsed until requested and applies backend filters', async () => {
    render(<SearchResultsClient repo={repo} initialQuery="" initialBranch="main" />)

    expect(screen.queryByLabelText(/score mínimo/i)).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/pergunte sobre este repositório/i), {
      target: { value: 'auth' },
    })
    fireEvent.click(screen.getByRole('button', { name: /filtros avançados/i }))
    fireEvent.change(screen.getByLabelText(/limite/i), { target: { value: '50' } })
    fireEvent.change(screen.getByLabelText(/score mínimo/i), { target: { value: '0.7' } })
    fireEvent.click(screen.getByRole('button', { name: /aplicar filtros/i }))

    await waitFor(() => {
      expect(streamSemanticSearch).toHaveBeenCalledWith(
        'repo-1',
        { q: 'auth', branch: 'main', limit: 50, min_score: 0.7 },
        expect.any(Object),
        expect.any(AbortSignal)
      )
    })
  })

  it('keeps rendered results when synthesis fails after the results event', async () => {
    const onSynthesisError = jest.fn()
    ;(streamSemanticSearch as jest.Mock).mockImplementationOnce(async (_repoId, _params, handlers) => {
      handlers.onResults?.({
        query: 'auth',
        total: 1,
        results: [
          {
            file_path: 'internal/auth/login.go',
            content: 'func Login() {}',
            language: 'go',
            start_line: 42,
            end_line: 43,
            score: 0.91,
            provider: 'voyage',
            model: 'voyage-code-3',
            branch: 'main',
          },
        ],
      })
      throw new Error('synthesis_stream_failed')
    })

    render(<SearchResultsClient repo={repo} initialQuery="auth" initialBranch="main" onSynthesisError={onSynthesisError} />)

    expect(await screen.findByText(/internal\/auth\/login.go/i)).toBeInTheDocument()
    expect(screen.queryByText(/não foi possível buscar/i)).not.toBeInTheDocument()
    expect(onSynthesisError).toHaveBeenCalledWith({ reason: 'synthesis_stream_failed' })
  })
})
