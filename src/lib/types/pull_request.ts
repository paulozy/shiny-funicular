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
  /**
   * Why the viewer cannot review this PR, or null when nothing known stops
   * them. Only the detail endpoint fills it; the list does not.
   *
   * Advisory, not a permission check — the host is still the authority, and it
   * enforces rules that are invisible from here. Null means "nothing we can
   * see", never "allowed". Present as `null` rather than omitted on purpose:
   * see the Go DTO for why absent must not be confused with null.
   */
  review_blocked_reason?: string | null
  /**
   * The current review verdict, or null when the host could not be asked.
   *
   * Null and `''` are different: `''` is a measured "nobody has reviewed",
   * null is "we do not know". Render null as nothing — never as "not
   * reviewed". Only the detail endpoint and the repository PR list fill it;
   * change requests past the backend's per-list ceiling report null.
   */
  review_decision?: ReviewDecision | null
  approved_by?: string[]
  changes_requested_by?: string[]
}

export type ReviewDecision = 'approved' | 'changes_requested' | 'commented' | ''

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
