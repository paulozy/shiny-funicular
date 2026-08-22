/**
 * Mirrors the backend's onboarding DTOs (`internal/models/onboarding_dto.go`
 * and `onboarding_run_dto.go`).
 *
 * Two fields are worth reading closely because they encode decisions the UI
 * must not re-derive:
 *
 * - `completion_mode` says how a step gets marked done. The server decides it
 *   from the step's kind, so the UI can never claim the platform verified
 *   something it merely watched someone click.
 * - `unavailable` replaces `resolved` when the entity a step points at no
 *   longer exists. A step in that state still renders — it just explains
 *   itself.
 */

export type OnboardingStepKind =
  | 'markdown'
  | 'repository'
  | 'team'
  | 'doc'
  | 'architecture'
  | 'glossary'
  | 'contacts'
  | 'checklist'
  | 'link'
  | 'verified'
  | 'task'

export type OnboardingCompletionMode = 'auto' | 'acknowledge' | 'self_reported' | 'verified'

export type OnboardingVerifiedCheck = 'first_change_request' | 'team_membership'

export type OnboardingStepStatus = 'done' | 'skipped'

export type OnboardingAssignmentStatus = 'pending' | 'in_progress' | 'completed' | 'abandoned'

export interface OnboardingStepContact {
  user_id: string
  area?: string
  when_to_reach?: string
}

export interface OnboardingStepChecklistItem {
  text: string
  url?: string
}

export interface OnboardingStepConfig {
  repository_id?: string
  team_id?: string
  doc_generation_id?: string
  doc_type?: string
  repository_ids?: string[]
  term_ids?: string[]
  people?: OnboardingStepContact[]
  items?: OnboardingStepChecklistItem[]
  url?: string
  label?: string
  instructions?: string
  task_url?: string
  check?: OnboardingVerifiedCheck
}

export interface OnboardingStep {
  id: string
  position: number
  kind: OnboardingStepKind
  title: string
  body?: string
  config: OnboardingStepConfig
  is_required: boolean
  estimated_minutes?: number
  completion_mode: OnboardingCompletionMode
}

export interface OnboardingFlow {
  id: string
  name: string
  slug: string
  description?: string
  is_default: boolean
  step_count: number
  total_minutes: number
  steps?: OnboardingStep[]
  created_at: string
  updated_at: string
}

export interface OnboardingFlowListResponse {
  items: OnboardingFlow[]
  total: number
}

export interface CreateOnboardingFlowRequest {
  name: string
  slug?: string
  description?: string
  is_default?: boolean
  template_id?: string
}

export interface UpdateOnboardingFlowRequest {
  name?: string
  slug?: string
  description?: string
  is_default?: boolean
}

export interface OnboardingStepInput {
  id?: string
  kind: OnboardingStepKind
  title: string
  body?: string
  config: OnboardingStepConfig
  is_required?: boolean
  estimated_minutes?: number | null
}

export interface OnboardingTemplateStep {
  kind: OnboardingStepKind
  title: string
  body?: string
  config: OnboardingStepConfig
  is_required: boolean
  estimated_minutes?: number
}

export interface OnboardingTemplate {
  id: string
  label: string
  description: string
  steps: OnboardingTemplateStep[]
}

export interface OnboardingTemplateListResponse {
  items: OnboardingTemplate[]
  total: number
}

// ── the runner ───────────────────────────────────────────────────────────────

export interface ResolvedTeamRepository {
  id: string
  name: string
  description?: string
}

export interface ResolvedTeamMember {
  user_id: string
  email: string
  full_name: string
  role: string
}

export interface ResolvedTeam {
  id: string
  name: string
  slug: string
  description?: string
  members: ResolvedTeamMember[]
  repositories: ResolvedTeamRepository[]
}

export interface ResolvedDoc {
  id: string
  doc_type?: string
  content: string
  created_at: string
}

export interface ResolvedContact {
  user_id: string
  full_name?: string
  email?: string
  area?: string
  when_to_reach?: string
}

export interface ResolvedGlossaryTerm {
  id: string
  term: string
  definition: string
}

export interface VerificationState {
  check: OnboardingVerifiedCheck
  description: string
}

export interface VerificationResult {
  passed: boolean
  /**
   * Pending means the check could not run — nobody connected the provider, the
   * organization has no token, the provider was unreachable. It is not a
   * failure, and the UI must not render it as one.
   */
  pending: boolean
  how: string
  detail?: string
}

/** Loose shape for the repository a step resolves to; the runner only reads a
 * few fields and the full DTO lives in `@/lib/types/repository`. */
export interface ResolvedRepository {
  id: string
  name: string
  description?: string
  url: string
  type: string
  metadata?: {
    languages?: Record<string, number>
    has_ci?: boolean
    has_tests?: boolean
    default_branch?: string
  }
  owner_team?: { id: string; name: string } | null
  scorecard?: {
    passing: number
    failing: number
    total: number
    verdicts: Array<{ check_id: string; title: string; status: string; reason: string }>
  } | null
}

export interface OnboardingStepResolved {
  repository?: ResolvedRepository
  team?: ResolvedTeam
  doc?: ResolvedDoc
  graph?: { nodes: Array<Record<string, unknown>>; edges: Array<Record<string, unknown>> }
  terms?: ResolvedGlossaryTerm[]
  people?: ResolvedContact[]
  verification?: VerificationState
}

export interface OnboardingRunStep extends OnboardingStep {
  status?: OnboardingStepStatus
  note?: string
  completed_at?: string
  resolved?: OnboardingStepResolved
  unavailable?: string
}

export interface OnboardingRun {
  assignment_id: string
  status: OnboardingAssignmentStatus
  flow_id: string
  flow_name: string
  flow_summary?: string
  steps_total: number
  steps_done: number
  required_remaining: number
  total_minutes: number
  started_at?: string
  completed_at?: string
  feedback?: string
  steps: OnboardingRunStep[]
}

export interface OnboardingRunListResponse {
  items: OnboardingRun[]
  total: number
}

export interface MarkOnboardingStepRequest {
  status: OnboardingStepStatus
  note?: string
}

export interface OnboardingFeedbackRequest {
  feedback: string
}

// ── assignments ──────────────────────────────────────────────────────────────

export interface AssignOnboardingRequest {
  flow_id: string
  user_id: string
}

export interface OnboardingAssignmentSummary {
  id: string
  flow_id: string
  flow_name: string
  user_id: string
  user_name?: string
  user_email?: string
  status: OnboardingAssignmentStatus
  steps_done: number
  steps_total: number
  started_at?: string
  completed_at?: string
  feedback?: string
  feedback_at?: string
  created_at: string
}

export interface OnboardingAssignmentListResponse {
  items: OnboardingAssignmentSummary[]
  total: number
}

// ── glossary ─────────────────────────────────────────────────────────────────

export interface GlossaryTerm {
  id: string
  term: string
  definition: string
  created_at: string
  updated_at: string
}

export interface GlossaryTermListResponse {
  items: GlossaryTerm[]
  total: number
}

export interface CreateGlossaryTermRequest {
  term: string
  definition: string
}

export interface UpdateGlossaryTermRequest {
  term?: string
  definition?: string
}
