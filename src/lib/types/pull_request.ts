// Types for the GitHub pull requests exposed by the backend.
//
// Sources of truth (backend):
// - integrations/github/pr.go:  PullRequest, PRFile
// - models/pull_request_dto.go: PullRequestResponse / PullRequestListItemResponse / PullRequestListResponse
// - handlers/pull_requests.go:  GET /repositories/:id/pull-requests

export type PullRequestState = 'open' | 'closed' | 'merged'

export interface PullRequestResponse {
  id: number
  number: number
  title: string
  body?: string
  state: PullRequestState
  author_login: string
  head_branch: string
  head_sha: string
  base_branch: string
  base_sha: string
  draft: boolean
  /**
   * Null when the provider did not report the number — GitHub omits all of
   * these when *listing* pull requests and fills them only on the detail call.
   * Distinct from 0, which means "measured, and nothing changed". Never render
   * a null as zero.
   */
  commits_count: number | null
  changed_files: number | null
  additions_count: number | null
  deletions_count: number | null
  html_url: string
  created_at: string
  updated_at: string
  merged_at?: string
}

export interface PullRequestListItemResponse {
  pull_request: PullRequestResponse
}

export interface PullRequestListResponse {
  items: PullRequestListItemResponse[]
  total: number
}

export interface PullRequestFileResponse {
  sha: string
  filename: string
  status: string
  additions: number
  deletions: number
  changes: number
  patch?: string
}

export interface PullRequestFilesResponse {
  items: PullRequestFileResponse[]
  total: number
}

export interface PullRequestDetailResponse {
  pull_request: PullRequestResponse
  files: PullRequestFileResponse[]
}
