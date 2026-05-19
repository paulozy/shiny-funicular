// Types for code analyses + issues exposed by the backend.
//
// Sources of truth:
// - models/code_analysis.go (backend): CodeAnalysis, CodeIssue
// - handlers/analysis.go    (backend): GET /repositories/:id/analyses → AnalysisListResponse

export type SeverityLevel = 'critical' | 'error' | 'warning' | 'info'

export type AnalysisType =
  | 'code_review'
  | 'security'
  | 'architecture'
  | 'dependency'
  | 'search_synthesis'

export type AnalysisStatus = 'pending' | 'in_progress' | 'completed' | 'failed'

export interface CodeIssue {
  id?: string
  file?: string
  line?: number
  column?: number
  severity: SeverityLevel
  category: string
  title: string
  description: string
  suggestion?: string
  code?: string
  is_ai_generated: boolean
  confidence: number
  url?: string
  related_issues?: string[]
  cwe_id?: string
  owasp_category?: string
  pattern?: string
  debt_category?: string
}

export interface CodeAnalysis {
  id: string
  repository_id: string
  pull_request_id?: number
  type: AnalysisType
  status: AnalysisStatus
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

export interface AnalysisListResponse {
  total: number
  analyses: CodeAnalysis[]
  limit: number
  offset: number
}
