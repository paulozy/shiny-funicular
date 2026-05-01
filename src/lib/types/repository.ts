export type RepoProvider = 'github' | 'gitlab' | 'gitea'
export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'error'

export interface RepositoryMetadata {
  pr_count?: number
  issue_count?: number
  test_coverage?: number
  languages?: Record<string, number>
  default_branch?: string
}

export interface RepositoryResponse {
  id: string
  name: string
  full_name: string
  description?: string
  url: string
  provider: RepoProvider
  is_private: boolean
  metadata?: RepositoryMetadata
  sync_status?: SyncStatus
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

export interface CreateRepositoryRequest {
  url: string
  description?: string
  is_private?: boolean
}
