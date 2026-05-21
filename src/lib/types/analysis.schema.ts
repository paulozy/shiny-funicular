import { z } from 'zod'
import type {
  AnalysisListResponse,
  AnalysisStatus,
  AnalysisType,
  CodeAnalysis,
  CodeIssue,
  SeverityLevel,
} from './analysis'

export const SeverityLevelSchema: z.ZodType<SeverityLevel> = z.enum([
  'critical',
  'error',
  'warning',
  'info',
])

export const AnalysisTypeSchema: z.ZodType<AnalysisType> = z.enum([
  'code_review',
  'security',
  'architecture',
  'dependency',
  'search_synthesis',
])

export const AnalysisStatusSchema: z.ZodType<AnalysisStatus> = z.enum([
  'pending',
  'in_progress',
  'completed',
  'failed',
])

export const CodeIssueSchema = z.object({
  id: z.string().optional(),
  file: z.string().optional(),
  line: z.number().optional(),
  column: z.number().optional(),
  severity: SeverityLevelSchema,
  category: z.string(),
  title: z.string(),
  description: z.string(),
  suggestion: z.string().optional(),
  code: z.string().optional(),
  is_ai_generated: z.boolean(),
  confidence: z.number(),
  url: z.string().optional(),
  related_issues: z.array(z.string()).optional(),
  cwe_id: z.string().optional(),
  owasp_category: z.string().optional(),
  pattern: z.string().optional(),
  debt_category: z.string().optional(),
})

export const CodeAnalysisSchema = z.object({
  id: z.string(),
  repository_id: z.string(),
  pull_request_id: z.number().optional(),
  type: AnalysisTypeSchema,
  status: AnalysisStatusSchema,
  summary_text: z.string().optional(),
  issues: z.array(CodeIssueSchema),
  issue_count: z.number(),
  critical_count: z.number(),
  error_count: z.number(),
  warning_count: z.number(),
  info_count: z.number(),
  ai_model: z.string().optional(),
  tokens_used: z.number(),
  processing_ms: z.number().optional(),
  error_message: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const AnalysisListResponseSchema = z.object({
  total: z.number(),
  analyses: z.array(CodeAnalysisSchema),
  limit: z.number(),
  offset: z.number(),
})

// Compile-time sanity checks — both directions, so drift between schema and
// interface fails `tsc` whether a field is added, removed, or has its type
// changed on only one side. Stripped from runtime by the TS compiler.
// eslint-disable-next-line no-unused-vars
const _codeIssueSchemaOk: z.infer<typeof CodeIssueSchema> = {} as CodeIssue
// eslint-disable-next-line no-unused-vars
const _codeIssueInterfaceOk: CodeIssue = {} as z.infer<typeof CodeIssueSchema>
// eslint-disable-next-line no-unused-vars
const _codeAnalysisSchemaOk: z.infer<typeof CodeAnalysisSchema> = {} as CodeAnalysis
// eslint-disable-next-line no-unused-vars
const _codeAnalysisInterfaceOk: CodeAnalysis = {} as z.infer<typeof CodeAnalysisSchema>
// eslint-disable-next-line no-unused-vars
const _listSchemaOk: z.infer<typeof AnalysisListResponseSchema> = {} as AnalysisListResponse
// eslint-disable-next-line no-unused-vars
const _listInterfaceOk: AnalysisListResponse = {} as z.infer<typeof AnalysisListResponseSchema>
