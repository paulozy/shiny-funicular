// Types for the repository issues exposed by the backend.
//
// Sources of truth (backend):
// - integrations/scm/types.go:  Issue
// - models/issue_dto.go:        IssueResponse / IssueListResponse
// - handlers/repository_browse.go: GET /repositories/:id/issues

export type IssueState = 'open' | 'closed'

export interface IssueResponse {
  number: number
  title: string
  state: IssueState
  author_login: string
  labels: string[]
  comments_count: number
  html_url: string
  created_at: string
  updated_at: string
}

export interface IssueListResponse {
  items: IssueResponse[]
  total: number
}
