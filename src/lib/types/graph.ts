import { RepoProvider, RepositoryAnalysisStatus, RepositoryMetadata, SyncStatus } from '@/lib/types/repository'

export type RelationshipKind =
  | 'http'
  | 'async'
  | 'library'
  | 'data'
  | 'infra'
  | 'manual'
  | 'other'

export const RELATIONSHIP_KINDS: RelationshipKind[] = [
  'http',
  'async',
  'library',
  'data',
  'infra',
  'manual',
  'other',
]

export const RELATIONSHIP_KIND_LABELS: Record<RelationshipKind, string> = {
  http: 'HTTP',
  async: 'Async',
  library: 'Biblioteca',
  data: 'Dados',
  infra: 'Infra',
  manual: 'Manual',
  other: 'Outro',
}

export type RelationshipSource =
  | 'manual'
  | 'analysis'
  | 'manifest'
  | 'import'
  | 'webhook'
  | 'legacy_dependency'

export interface RepositoryGraphNode {
  id: string
  name: string
  description?: string
  url: string
  type: RepoProvider
  metadata?: RepositoryMetadata
  analysis_status?: RepositoryAnalysisStatus | string | null
  sync_status?: SyncStatus
}

export interface RepositoryGraphEdge {
  id: string
  source_repository_id: string
  target_repository_id: string
  kind: RelationshipKind
  label?: string
  description?: string
  source: RelationshipSource
  confidence: number
  metadata?: Record<string, unknown>
}

export interface RepositoryGraphResponse {
  nodes: RepositoryGraphNode[]
  edges: RepositoryGraphEdge[]
}

export interface CreateRepositoryRelationshipRequest {
  source_repository_id: string
  target_repository_id: string
  kind: RelationshipKind
  label?: string
  description?: string
  metadata?: Record<string, unknown>
}

export interface UpdateRepositoryRelationshipRequest {
  kind?: RelationshipKind
  label?: string
  description?: string
  confidence?: number
  metadata?: Record<string, unknown>
}

export interface GetGraphParams {
  repository_id?: string
  kind?: RelationshipKind
  source?: RelationshipSource
  include_metadata?: boolean
}
