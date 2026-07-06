import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PullRequestDetailClient } from '@/app/(app)/code/repositories/[id]/pull-requests/[pr_number]/PullRequestDetailClient'
import { PullRequestDetailResponse } from '@/lib/types/pull_request'
import { apiFetch } from '@/lib/api/client'

jest.mock('@/lib/api/client', () => ({
  apiFetch: jest.fn(),
  AuthError: class AuthError extends Error {
    code: string
    status?: number
    constructor(code: string, message: string, status?: number) {
      super(message)
      this.code = code
      this.status = status
    }
  },
}))

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>

const basePR: PullRequestDetailResponse['pull_request'] = {
  id: 1,
  number: 42,
  title: 'Refactor auth middleware',
  state: 'open',
  author_login: 'paulozy',
  head_branch: 'feat/auth',
  head_sha: 'abc',
  base_branch: 'main',
  base_sha: 'def',
  draft: false,
  commits_count: 3,
  changed_files: 4,
  additions_count: 80,
  deletions_count: 12,
  html_url: 'https://github.com/owner/repo/pull/42',
  created_at: '2026-05-15T10:00:00Z',
  updated_at: '2026-05-18T22:00:00Z',
}

function detail(overrides: Partial<PullRequestDetailResponse> = {}): PullRequestDetailResponse {
  return { pull_request: basePR, files: [], ...overrides }
}

describe('PullRequestDetailClient', () => {
  beforeEach(() => mockApiFetch.mockReset())

  it('shows an empty state with a "Revisar PR" button when there is no review', () => {
    render(
      <PullRequestDetailClient repoId="r1" prNumber={42} initialDetail={detail()} loadError={null} />
    )
    expect(screen.getByText(/ainda não foi revisado/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /revisar pr/i })).toBeInTheDocument()
  })

  it('renders the summary and findings when a completed review exists', () => {
    const withReview = detail({
      latest_analysis: {
        id: 'a1',
        repository_id: 'r1',
        pull_request_id: 42,
        type: 'code_review',
        status: 'completed',
        summary_text: 'Revisão concluída com pontos de atenção.',
        issues: [
          {
            severity: 'critical',
            category: 'security',
            title: 'SQL injection possível',
            description: 'Query concatena input do usuário.',
            file: 'internal/db/user.go',
            line: 88,
            suggestion: 'Use query parametrizada.',
          },
        ],
        issue_count: 1,
        critical_count: 1,
        error_count: 0,
        warning_count: 0,
        info_count: 0,
        tokens_used: 1200,
        created_at: '2026-05-18T21:00:00Z',
        updated_at: '2026-05-18T21:00:00Z',
      },
    })
    render(
      <PullRequestDetailClient repoId="r1" prNumber={42} initialDetail={withReview} loadError={null} />
    )
    expect(screen.getByText(/Revisão concluída com pontos de atenção/i)).toBeInTheDocument()
    expect(screen.getByText('SQL injection possível')).toBeInTheDocument()
    expect(screen.getByText('internal/db/user.go:88')).toBeInTheDocument()
    expect(screen.getByText(/Use query parametrizada/i)).toBeInTheDocument()
  })

  it('shows a load error state', () => {
    render(
      <PullRequestDetailClient repoId="r1" prNumber={42} initialDetail={null} loadError="503" />
    )
    expect(screen.getByRole('alert')).toHaveTextContent(/não foi possível carregar/i)
  })

  it('triggers a review via the analyze endpoint and flips to "Revisando…"', async () => {
    mockApiFetch.mockResolvedValueOnce({ status: 'queued' } as never)
    render(
      <PullRequestDetailClient repoId="r1" prNumber={42} initialDetail={detail()} loadError={null} />
    )
    fireEvent.click(screen.getByRole('button', { name: /revisar pr/i }))

    await waitFor(() =>
      expect(mockApiFetch).toHaveBeenCalledWith(
        '/api/repositories/r1/pull-requests/42/analyze',
        { method: 'POST' }
      )
    )
    expect(await screen.findByRole('button', { name: /revisando/i })).toBeInTheDocument()
  })

  it('shows the diff even before any review has run', () => {
    const withFiles = detail({
      files: [
        {
          sha: 's',
          filename: 'a.go',
          status: 'modified',
          additions: 1,
          deletions: 0,
          changes: 1,
          patch: ['@@ -1,1 +1,2 @@', ' ctx', '+new line here'].join('\n'),
        },
      ],
    })
    render(
      <PullRequestDetailClient repoId="r1" prNumber={42} initialDetail={withFiles} loadError={null} />
    )
    expect(screen.getByText(/Alterações/)).toBeInTheDocument()
    expect(screen.getByText(/new line here/)).toBeInTheDocument()
    // and the review section still invites a first review
    expect(screen.getByText(/ainda não foi revisado/i)).toBeInTheDocument()
  })
})
