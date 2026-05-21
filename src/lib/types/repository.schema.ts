import { z } from 'zod'
import type {
  BackendRepositoryListResponse,
  BackendRepositoryResponse,
  CoverageStatus,
  EmbeddingsStatus,
  RepoProvider,
  RepositoryAnalysisStatus,
  RepositoryMetadata,
  RepositoryStats,
  SyncStatus,
} from './repository'

const RepoProviderSchema: z.ZodType<RepoProvider> = z.enum([
  'github',
  'gitlab',
  'gitea',
  'custom',
])

const SyncStatusSchema: z.ZodType<SyncStatus> = z.enum([
  'idle',
  'syncing',
  'synced',
  'error',
])

const RepositoryAnalysisStatusSchema: z.ZodType<RepositoryAnalysisStatus> = z.enum([
  'pending',
  'in_progress',
  'completed',
  'failed',
])

const CoverageStatusSchema: z.ZodType<CoverageStatus> = z.enum([
  'ok',
  'partial',
  'failed',
  'not_configured',
])

// EmbeddingsStatusSchema is exported for symmetry with the type module; not
// used in the seed (the embeddings-state shape isn't validated by this PR).
// eslint-disable-next-line no-unused-vars
const EmbeddingsStatusSchema: z.ZodType<EmbeddingsStatus> = z.enum([
  'idle',
  'pending',
  'indexing',
  'indexed',
  'stale',
  'failed',
])

const RepositoryMetadataSchema: z.ZodType<RepositoryMetadata> = z.object({
  pr_count: z.number().optional(),
  issue_count: z.number().optional(),
  test_coverage: z.number().optional(),
  tested_lines: z.number().optional(),
  uncovered_lines: z.number().optional(),
  coverage_status: CoverageStatusSchema.optional(),
  languages: z.record(z.string(), z.number()).optional(),
  default_branch: z.string().optional(),
  frameworks: z.array(z.string()).optional(),
  topics: z.array(z.string()).optional(),
  star_count: z.number().optional(),
  fork_count: z.number().optional(),
  branch_count: z.number().optional(),
  commit_count: z.number().optional(),
  contributors: z.number().optional(),
  has_ci: z.boolean().optional(),
  has_tests: z.boolean().optional(),
})

const RepositoryStatsPartialSchema: z.ZodType<Partial<RepositoryStats>> = z.object({
  total_analyses: z.number().optional(),
  latest_quality_score: z.number().optional(),
  has_analysis: z.boolean().optional(),
  last_analyzed_at: z.string().nullable().optional(),
  test_coverage: z.number().optional(),
  tested_lines: z.number().optional(),
  uncovered_lines: z.number().optional(),
  coverage_status: z.union([CoverageStatusSchema, z.literal('')]).optional(),
})

export const BackendRepositoryResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  url: z.string(),
  type: RepoProviderSchema.optional(),
  provider: RepoProviderSchema.optional(),
  full_name: z.string().optional(),
  organization_id: z.string(),
  owner_user_id: z.string().optional(),
  created_by_user_id: z.string().optional(),
  is_public: z.boolean().optional(),
  is_private: z.boolean().optional(),
  metadata: RepositoryMetadataSchema.optional(),
  sync_status: SyncStatusSchema.optional(),
  sync_error: z.string().optional(),
  last_synced_at: z.string().optional(),
  // The backend can return the analysis_status as an enum, an unrecognised
  // string, or explicit null. Mirror the TS interface to avoid false negatives.
  analysis_status: z.union([RepositoryAnalysisStatusSchema, z.string(), z.null()]).optional(),
  analysis_error: z.string().optional(),
  reviews_count: z.number().nullable().optional(),
  stats: RepositoryStatsPartialSchema.nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const BackendRepositoryListResponseSchema = z.object({
  items: z.array(BackendRepositoryResponseSchema).optional(),
  repositories: z.array(BackendRepositoryResponseSchema).optional(),
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
})

// Compile-time cross-checks (see analysis.schema.ts for the rationale).
// eslint-disable-next-line no-unused-vars
const _backendRepoSchemaOk: z.infer<typeof BackendRepositoryResponseSchema> = {} as BackendRepositoryResponse
// eslint-disable-next-line no-unused-vars
const _backendRepoInterfaceOk: BackendRepositoryResponse = {} as z.infer<typeof BackendRepositoryResponseSchema>
// eslint-disable-next-line no-unused-vars
const _backendListSchemaOk: z.infer<typeof BackendRepositoryListResponseSchema> = {} as BackendRepositoryListResponse
// eslint-disable-next-line no-unused-vars
const _backendListInterfaceOk: BackendRepositoryListResponse = {} as z.infer<typeof BackendRepositoryListResponseSchema>
