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

/**
 * Who produced a documentation row.
 *
 * The backing table is named for an AI run, but it has always held rows that
 * are not one — editing a document by hand inserts a completed row with no
 * tokens. This names that instead of leaving it to be inferred from absent
 * fields.
 */
export type DocSource = 'ai' | 'manual'

export interface DocGenerationSummary {
  id: string
  source: DocSource
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

/**
 * A document written by a person. One type per request, unlike generation
 * which accepts several — batching exists there only to spend one pull
 * request on several files.
 */
export interface CreateManualDocRequest {
  type: DocType
  content: string
}

export interface UpdateDocContentRequest {
  content: Partial<Record<DocType, string>>
}

export interface DocGenerationAcceptedResponse {
  id: string
  status: DocGenerationStatus
}

// DocTemplate mirrors the backend's `docs.DocTemplate` registry entry.
//
// The registry covers both scopes and they are not interchangeable: an org
// template is picked one at a time and produces a document that lives only in
// this platform, while a repo template is one of several a caller may request
// at once and produces a file in the repository. Always fetch with an explicit
// scope — a gallery that mixes them offers an org-wide guideline next to a
// repository's CONTRIBUTING.md as if they were alternatives.
export type DocTemplateType = 'adr' | 'architecture' | 'guidelines' | 'service_doc'

export type DocTemplateScope = 'org' | 'repo'

export interface DocTemplate {
  id: string
  label: string
  description: string
  type: DocTemplateType
  scope: DocTemplateScope
  sections: string[]
  /**
   * The file this document lands on inside the repository. Only repo-scope
   * templates have one — org docs have no repository to commit to.
   *
   * This is the most concrete thing the UI can tell someone about what a
   * generation will produce: a file, at this path, delivered as a pull request.
   */
  output_path?: string
}

export function isTerminalDocStatus(status: DocGenerationStatus): boolean {
  return status === 'completed' || status === 'failed'
}
