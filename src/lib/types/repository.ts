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
  has_ci?: boolean
  has_tests?: boolean
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
  stats?: RepositoryStats
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
