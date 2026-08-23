import { Scorecard } from '@/lib/types/scorecard'
import { TeamRef } from '@/lib/types/teams'

export type RepoProvider = 'github' | 'gitlab' | 'gitea' | 'custom'
export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error'
export type CoverageStatus = 'ok' | 'partial' | 'failed' | 'not_configured'

export interface RepositoryMetadata {
  pr_count?: number
  issue_count?: number
  test_coverage?: number
  tested_lines?: number
  uncovered_lines?: number
  coverage_status?: CoverageStatus
  languages?: Record<string, number>
  default_branch?: string
  frameworks?: string[]
  topics?: string[]
  star_count?: number
  fork_count?: number
  branch_count?: number
  commit_count?: number
  contributors?: number
  /**
   * Tri-state on the wire: true, false, or absent. Absent means sync never
   * determined it — do not render that as "no".
   */
  has_ci?: boolean
  has_tests?: boolean
  ci_evidence?: string
  test_evidence?: string
}

export interface RepositoryStats {
  /**
   * False when the repository's CI has never uploaded a coverage report.
   * Distinguishes "not measured" from a genuine 0%.
   */
  has_coverage: boolean
  test_coverage?: number
  tested_lines?: number
  uncovered_lines?: number
  coverage_status?: CoverageStatus | ''
  coverage_uploaded_at?: string | null
}

export interface RepositoryResponse {
  id: string
  name: string
  full_name: string
  description?: string
  url: string
  provider: RepoProvider
  type?: RepoProvider
  is_private: boolean
  is_public?: boolean
  metadata?: RepositoryMetadata
  sync_status?: SyncStatus
  sync_error?: string
  last_synced_at?: string
  /** The accountable team. Absent means unowned, which the catalog surfaces. */
  owner_team?: TeamRef
  stats?: RepositoryStats
  /** Deterministic maturity checks, computed server-side on each read. */
  scorecard?: Scorecard
  created_at: string
  updated_at: string
  organization_id: string
}

export interface RepositoryListResponse {
  repositories: RepositoryResponse[]
  total: number
  limit: number
  offset: number
}

export interface BackendRepositoryResponse {
  id: string
  name: string
  description?: string
  url: string
  type?: RepoProvider
  provider?: RepoProvider
  full_name?: string
  organization_id: string
  owner_user_id?: string
  created_by_user_id?: string
  is_public?: boolean
  is_private?: boolean
  metadata?: RepositoryMetadata
  sync_status?: SyncStatus
  sync_error?: string
  last_synced_at?: string
  owner_team?: TeamRef
  scorecard?: Scorecard
  stats?: Partial<RepositoryStats> | null
  created_at: string
  updated_at: string
}

export interface BackendRepositoryListResponse {
  items?: BackendRepositoryResponse[]
  repositories?: BackendRepositoryResponse[]
  total: number
  limit: number
  offset: number
}

export interface CreateRepositoryRequest {
  url: string
  description?: string
  is_private?: boolean
  is_public?: boolean
}

/**
 * Whether this repository's host can express "request changes" on a change
 * request.
 *
 * GitHub has the REQUEST_CHANGES review event. GitLab exposes approve and
 * unapprove over REST but no reviewer "requested changes" state that is stable
 * across the versions a self-hosted instance may run, so the backend answers
 * 501 `unsupported_capability` there (see `scm.ErrUnsupportedCapability`).
 *
 * This is the single place that knowledge lives on the client — hide the
 * control rather than offer a button guaranteed to fail.
 */
export function supportsRequestChanges(
  repo: { provider?: RepoProvider; type?: RepoProvider } | null | undefined
): boolean {
  return (repo?.provider ?? repo?.type) === 'github'
}
