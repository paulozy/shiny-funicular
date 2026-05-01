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
  synthesize?: boolean
}

export interface SearchSynthesisDone {
  cached?: boolean
  tokens_used?: number
  model?: string
}

export interface SearchSynthesisUnavailable {
  reason: 'anthropic_not_configured' | 'synthesizer_not_wired' | string
}

export interface SearchSynthesisError {
  reason: 'synthesis_start_failed' | 'synthesis_stream_failed' | string
}

export type SearchSynthesisStatus = 'idle' | 'streaming' | 'done' | 'cached' | 'unavailable' | 'error'

export interface SearchInsight {
  status: SearchSynthesisStatus
  query: string
  text: string
  results?: SemanticSearchResult[]
  reason?: string
  cached?: boolean
  tokensUsed?: number
  model?: string
}
