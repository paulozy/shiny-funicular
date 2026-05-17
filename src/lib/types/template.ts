export type TemplateStatus = 'pending' | 'generating' | 'completed' | 'failed'

export interface GeneratedFile {
  path: string
  content: string
  language: string
}

export interface StackProfile {
  languages?: string[]
  frameworks?: string[]
  topics?: string[]
  has_ci?: boolean
  has_tests?: boolean
}

export interface CodeTemplate {
  id: string
  organization_id: string
  repository_id?: string | null
  prompt: string
  stack_hint?: string
  stack_snapshot?: StackProfile | null
  status: TemplateStatus
  files: GeneratedFile[]
  summary?: string
  model?: string
  tokens_used: number
  processing_ms: number
  error_message?: string
  is_pinned: boolean
  name?: string
  pinned_by_user_id?: string | null
  pinned_at?: string | null
  created_by_user_id?: string | null
  created_at: string
  updated_at: string
}

export interface GenerateTemplateRequest {
  prompt: string
  stack_hint?: string
}

export interface PinTemplateRequest {
  is_pinned: boolean
  name?: string
}

export interface TemplateListResponse {
  templates: CodeTemplate[]
  total: number
  limit: number
  offset: number
}

export interface TemplateAcceptedResponse {
  id: string
  status: TemplateStatus
}

export interface ListTemplatesParams {
  pinned?: boolean
  status?: TemplateStatus
  limit?: number
  offset?: number
}

export function isTerminalTemplateStatus(status: TemplateStatus): boolean {
  return status === 'completed' || status === 'failed'
}
