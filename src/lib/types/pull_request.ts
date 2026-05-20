// Types for GitHub pull requests + their AI review analyses exposed by the
// backend.
//
// Sources of truth (backend):
// - integrations/github/pr.go: PullRequest, PRFile
// - models/pull_request.go:    PullRequestResponse / PullRequestListItemResponse / PullRequestListResponse
// - handlers/analysis_pull_requests.go: GET /repositories/:id/pull-requests

import { CodeIssue } from './analysis'

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
  commits_count: number
  changed_files: number
  additions_count: number
  deletions_count: number
  html_url: string
  created_at: string
  updated_at: string
  merged_at?: string
}

export interface PullRequestReviewAnalysisResponse {
  id: string
  repository_id: string
  pull_request_id: number
  type: string
  status: string
  summary_text?: string
  issues: CodeIssue[]
  issue_count: number
  critical_count: number
  error_count: number
  warning_count: number
  info_count: number
  ai_model?: string
  tokens_used: number
  processing_ms?: number
  error_message?: string
  created_at: string
  updated_at: string
}

export interface PullRequestListItemResponse {
  pull_request: PullRequestResponse
  latest_analysis?: PullRequestReviewAnalysisResponse
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
  latest_analysis?: PullRequestReviewAnalysisResponse
}
