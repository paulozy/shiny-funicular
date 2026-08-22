import { render, screen } from '@testing-library/react'
import { PullRequestDetailClient } from '@/app/(app)/code/repositories/[id]/pull-requests/[pr_number]/PullRequestDetailClient'
import { PullRequestDetailResponse } from '@/lib/types/pull_request'

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
  it('renders the PR identity and branch flow', () => {
    render(
      <PullRequestDetailClient repoId="r1" prNumber={42} initialDetail={detail()} loadError={null} />
    )
    expect(screen.getByText('Refactor auth middleware')).toBeInTheDocument()
    expect(screen.getByText('#42')).toBeInTheDocument()
    expect(screen.getByText('feat/auth')).toBeInTheDocument()
    expect(screen.getByText('main')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /abrir no provedor/i })).toHaveAttribute(
      'href',
      'https://github.com/owner/repo/pull/42'
    )
  })

  it('renders the diff for each changed file', () => {
    const withFiles = detail({
      files: [
        {
          sha: 's1',
          filename: 'internal/auth/middleware.go',
          status: 'modified',
          additions: 2,
          deletions: 1,
          changes: 3,
          patch: ['@@ -1,2 +1,3 @@', ' context line', '+added line'].join('\n'),
        },
      ],
    })
    render(
      <PullRequestDetailClient repoId="r1" prNumber={42} initialDetail={withFiles} loadError={null} />
    )
    expect(screen.getByText(/1 arquivo/)).toBeInTheDocument()
    expect(screen.getByText('internal/auth/middleware.go')).toBeInTheDocument()
    expect(screen.getByText(/added line/)).toBeInTheDocument()
  })

  it('reports when the PR carries no diff', () => {
    render(
      <PullRequestDetailClient repoId="r1" prNumber={42} initialDetail={detail()} loadError={null} />
    )
    expect(screen.getByText(/Nenhum diff disponível/i)).toBeInTheDocument()
  })

  it('shows a load error state', () => {
    render(
      <PullRequestDetailClient
        repoId="r1"
        prNumber={42}
        initialDetail={null}
        loadError="github indisponível"
      />
    )
    expect(screen.getByRole('alert')).toHaveTextContent(/github indisponível/i)
  })

  // The AI review pipeline is gone: nothing on this page should offer to
  // review the PR or surface findings.
  it('offers no AI review affordance', () => {
    render(
      <PullRequestDetailClient repoId="r1" prNumber={42} initialDetail={detail()} loadError={null} />
    )
    expect(screen.queryByRole('button', { name: /revisar/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/revisão da ia/i)).not.toBeInTheDocument()
  })
})
