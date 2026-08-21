import { z } from 'zod'
import type {
  BackendRepositoryListResponse,
  BackendRepositoryResponse,
  CoverageStatus,
  RepoProvider,
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

const CoverageStatusSchema: z.ZodType<CoverageStatus> = z.enum([
  'ok',
  'partial',
  'failed',
  'not_configured',
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
  ci_evidence: z.string().optional(),
  test_evidence: z.string().optional(),
  has_tests: z.boolean().optional(),
})

const RepositoryStatsPartialSchema: z.ZodType<Partial<RepositoryStats>> = z.object({
  has_coverage: z.boolean().optional(),
  test_coverage: z.number().optional(),
  tested_lines: z.number().optional(),
  uncovered_lines: z.number().optional(),
  coverage_status: z.union([CoverageStatusSchema, z.literal('')]).optional(),
  coverage_uploaded_at: z.string().nullable().optional(),
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
  owner_team: z
    .object({ id: z.string(), name: z.string(), slug: z.string() })
    .optional(),
  scorecard: z
    .object({
      passing: z.number(),
      failing: z.number(),
      not_applicable: z.number(),
      total: z.number(),
      verdicts: z.array(
        z.object({
          check_id: z.string(),
          version: z.number(),
          title: z.string(),
          status: z.enum(['pass', 'fail', 'not_applicable']),
          reason: z.string(),
        })
      ),
    })
    .optional(),
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
