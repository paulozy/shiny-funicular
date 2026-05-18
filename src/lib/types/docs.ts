export type DocGenerationStatus = 'pending' | 'in_progress' | 'completed' | 'failed'

export type DocType = 'adr' | 'architecture' | 'service_doc' | 'guidelines'

export const DOC_TYPES: DocType[] = ['adr', 'architecture', 'service_doc', 'guidelines']

export const DOC_TYPE_LABELS: Record<DocType, string> = {
  adr: 'ADRs',
  architecture: 'Arquitetura',
  service_doc: 'Serviço',
  guidelines: 'Diretrizes',
}

export interface DocGenerationSummary {
  id: string
  repository_id: string
  status: DocGenerationStatus
  types: DocType[]
  branch?: string
  gen_branch?: string
  pull_request_url?: string
  pull_request_number?: number
  tokens_used: number
  error_message?: string
  triggered_by_user_id?: string
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

export interface DocGenerationAcceptedResponse {
  id: string
  status: DocGenerationStatus
}

export function isTerminalDocStatus(status: DocGenerationStatus): boolean {
  return status === 'completed' || status === 'failed'
}
