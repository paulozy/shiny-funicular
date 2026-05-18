export type DocGenerationStatus = 'pending' | 'in_progress' | 'completed' | 'failed'

export type DocGenerationScope = 'repo' | 'org'

export type DocProgressStage = 'aggregating_context' | 'calling_claude' | 'persisting'

export type DocType = 'adr' | 'architecture' | 'service_doc' | 'guidelines'

export const DOC_TYPES: DocType[] = ['adr', 'architecture', 'service_doc', 'guidelines']

// Org-scope doc types only include the three that make sense at organization
// level — `service_doc` is per-repo by definition.
export const ORG_DOC_TYPES: DocType[] = ['adr', 'architecture', 'guidelines']

export const DOC_TYPE_LABELS: Record<DocType, string> = {
  adr: 'ADRs',
  architecture: 'Arquitetura',
  service_doc: 'Serviço',
  guidelines: 'Diretrizes',
}

export const DOC_PROGRESS_LABELS: Record<DocProgressStage, string> = {
  aggregating_context: 'Agregando contexto da organização…',
  calling_claude: 'Chamando Claude…',
  persisting: 'Persistindo resultado…',
}

export interface DocGenerationSummary {
  id: string
  organization_id: string
  scope: DocGenerationScope
  repository_id?: string
  template_id?: string
  superseded_by_id?: string
  progress_stage?: DocProgressStage | ''
  status: DocGenerationStatus
  types: DocType[]
  branch?: string
  gen_branch?: string
  pull_request_url?: string
  pull_request_number?: number
  tokens_used: number
  error_message?: string
  triggered_by_user_id?: string
  user_prompt?: string
  created_at: string
  updated_at: string
}

export interface DocGenerationDetail extends DocGenerationSummary {
  content: Partial<Record<DocType, string>>
}

export interface DocGenerationListResponse {
  items: DocGenerationSummary[]
  total: number
}

export interface GenerateDocsRequest {
  types: DocType[]
  branch?: string
}

export interface GenerateOrgDocsRequest {
  types: DocType[]
  template_id?: string
  prompt?: string
}

export interface UpdateDocContentRequest {
  content: Partial<Record<DocType, string>>
}

export interface DocGenerationAcceptedResponse {
  id: string
  status: DocGenerationStatus
}

// DocTemplate mirrors the backend's `docs.DocTemplate` registry entry.
export type DocTemplateType = 'adr' | 'architecture' | 'guidelines'

export interface DocTemplate {
  id: string
  label: string
  description: string
  type: DocTemplateType
  scope: 'org'
  sections: string[]
}

export function isTerminalDocStatus(status: DocGenerationStatus): boolean {
  return status === 'completed' || status === 'failed'
}
