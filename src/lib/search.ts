import { RepositoryResponse } from '@/lib/types/repository'
import { SemanticSearchParams } from '@/lib/types/search'

export const DEFAULT_SEARCH_LIMIT = 10
export const MAX_SEARCH_LIMIT = 50
export const DEFAULT_MIN_SCORE = 0.55

export function getDefaultSearchBranch(repo?: Pick<RepositoryResponse, 'metadata'> | null): string {
  return repo?.metadata?.default_branch || 'main'
}

export function normalizeSearchLimit(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10)
  if (parsed === 20 || parsed === 50) return parsed
  return DEFAULT_SEARCH_LIMIT
}

export function normalizeMinScore(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value ?? ''))
  if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 1) return parsed
  return DEFAULT_MIN_SCORE
}

export function formatSearchScore(score: number): string {
  return `${Math.round(score * 100)}%`
}

export function buildSemanticSearchQuery(params: SemanticSearchParams): string {
  const search = new URLSearchParams()
  search.set('q', params.q.trim())
  if (params.limit) search.set('limit', String(normalizeSearchLimit(params.limit)))
  if (params.branch?.trim()) search.set('branch', params.branch.trim())
  if (params.min_score !== undefined) search.set('min_score', String(normalizeMinScore(params.min_score)))
  if (params.synthesize) search.set('synthesize', 'true')
  return search.toString()
}

export function buildFileStubHref(
  repoId: string,
  result: { file_path: string; branch?: string; start_line?: number; end_line?: number }
): string {
  const search = new URLSearchParams()
  search.set('path', result.file_path)
  if (result.branch) search.set('branch', result.branch)
  if (result.start_line) search.set('start_line', String(result.start_line))
  if (result.end_line) search.set('end_line', String(result.end_line))
  return `/code/repositories/${repoId}/files?${search.toString()}`
}
