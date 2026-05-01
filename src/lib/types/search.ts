export interface GenerateEmbeddingsRequest {
  branch?: string
  commit_sha?: string
}

export interface SemanticSearchResponse {
  query: string
  total: number
  results: SemanticSearchResult[]
}

export interface SemanticSearchResult {
  file_path: string
  content: string
  language?: string
  start_line?: number
  end_line?: number
  score: number
  provider: string
  model: string
  branch?: string
}

export interface JobResponse {
  status: string
  type: string
  target: string
}

export interface SemanticSearchParams {
  q: string
  limit?: number
  branch?: string
  min_score?: number
}
