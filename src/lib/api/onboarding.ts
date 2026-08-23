import { backendFetch, getApiUrl, handleResponse } from '@/lib/api/_shared'
import {
  AssignOnboardingRequest,
  CreateGlossaryTermRequest,
  CreateOnboardingFlowRequest,
  GlossaryTerm,
  GlossaryTermListResponse,
  MarkOnboardingStepRequest,
  OnboardingAssignmentListResponse,
  OnboardingAssignmentSummary,
  OnboardingFeedbackRequest,
  OnboardingFlow,
  OnboardingFlowListResponse,
  OnboardingRun,
  OnboardingRunListResponse,
  OnboardingStepInput,
  OnboardingTemplateListResponse,
  UpdateGlossaryTermRequest,
  UpdateOnboardingFlowRequest,
  VerificationResult,
} from '@/lib/types/onboarding'

/**
 * Server-side callers into the backend's onboarding API. Only the BFF route
 * handlers use these — the browser goes through `/api/onboarding/*`, so the
 * access token never leaves the server.
 */

function authorized(accessToken: string, init?: RequestInit): RequestInit {
  return {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  }
}

// ── flows ────────────────────────────────────────────────────────────────────

export async function backendListOnboardingFlows(accessToken: string): Promise<OnboardingFlowListResponse> {
  const response = await backendFetch(getApiUrl('/onboarding/flows'), authorized(accessToken, { method: 'GET' }))
  return handleResponse<OnboardingFlowListResponse>(response)
}

export async function backendGetOnboardingFlow(accessToken: string, flowId: string): Promise<OnboardingFlow> {
  const response = await backendFetch(getApiUrl(`/onboarding/flows/${flowId}`), authorized(accessToken, { method: 'GET' }))
  return handleResponse<OnboardingFlow>(response)
}

export async function backendCreateOnboardingFlow(
  accessToken: string,
  body: CreateOnboardingFlowRequest
): Promise<OnboardingFlow> {
  const response = await fetch(
    getApiUrl('/onboarding/flows'),
    authorized(accessToken, { method: 'POST', body: JSON.stringify(body) })
  )
  return handleResponse<OnboardingFlow>(response)
}

export async function backendUpdateOnboardingFlow(
  accessToken: string,
  flowId: string,
  body: UpdateOnboardingFlowRequest
): Promise<OnboardingFlow> {
  const response = await fetch(
    getApiUrl(`/onboarding/flows/${flowId}`),
    authorized(accessToken, { method: 'PATCH', body: JSON.stringify(body) })
  )
  return handleResponse<OnboardingFlow>(response)
}

export async function backendDeleteOnboardingFlow(accessToken: string, flowId: string): Promise<void> {
  const response = await fetch(
    getApiUrl(`/onboarding/flows/${flowId}`),
    authorized(accessToken, { method: 'DELETE' })
  )
  return handleResponse<void>(response)
}

export async function backendDuplicateOnboardingFlow(accessToken: string, flowId: string): Promise<OnboardingFlow> {
  const response = await fetch(
    getApiUrl(`/onboarding/flows/${flowId}/duplicate`),
    authorized(accessToken, { method: 'POST' })
  )
  return handleResponse<OnboardingFlow>(response)
}

/**
 * Saves the whole step list. Array order is the flow's order, and steps that
 * already exist must carry their id — that is what keeps the progress rows
 * pointing at them alive.
 */
export async function backendReplaceOnboardingSteps(
  accessToken: string,
  flowId: string,
  steps: OnboardingStepInput[]
): Promise<OnboardingFlow> {
  const response = await fetch(
    getApiUrl(`/onboarding/flows/${flowId}/steps`),
    authorized(accessToken, { method: 'PUT', body: JSON.stringify({ steps }) })
  )
  return handleResponse<OnboardingFlow>(response)
}

export async function backendListOnboardingTemplates(
  accessToken: string
): Promise<OnboardingTemplateListResponse> {
  const response = await backendFetch(getApiUrl('/onboarding/templates'), authorized(accessToken, { method: 'GET' }))
  return handleResponse<OnboardingTemplateListResponse>(response)
}

// ── assignments ──────────────────────────────────────────────────────────────

export async function backendListOnboardingAssignments(
  accessToken: string
): Promise<OnboardingAssignmentListResponse> {
  const response = await backendFetch(getApiUrl('/onboarding/assignments'), authorized(accessToken, { method: 'GET' }))
  return handleResponse<OnboardingAssignmentListResponse>(response)
}

export async function backendAssignOnboarding(
  accessToken: string,
  body: AssignOnboardingRequest
): Promise<OnboardingAssignmentSummary> {
  const response = await fetch(
    getApiUrl('/onboarding/assignments'),
    authorized(accessToken, { method: 'POST', body: JSON.stringify(body) })
  )
  return handleResponse<OnboardingAssignmentSummary>(response)
}

// ── the runner ───────────────────────────────────────────────────────────────

export async function backendGetMyOnboarding(accessToken: string): Promise<OnboardingRunListResponse> {
  const response = await backendFetch(getApiUrl('/onboarding/me'), authorized(accessToken, { method: 'GET' }))
  return handleResponse<OnboardingRunListResponse>(response)
}

export async function backendMarkOnboardingStep(
  accessToken: string,
  stepId: string,
  body: MarkOnboardingStepRequest
): Promise<OnboardingRun> {
  const response = await fetch(
    getApiUrl(`/onboarding/me/steps/${stepId}`),
    authorized(accessToken, { method: 'POST', body: JSON.stringify(body) })
  )
  return handleResponse<OnboardingRun>(response)
}

export async function backendVerifyOnboardingStep(
  accessToken: string,
  stepId: string
): Promise<VerificationResult> {
  const response = await fetch(
    getApiUrl(`/onboarding/me/steps/${stepId}/verify`),
    authorized(accessToken, { method: 'POST' })
  )
  return handleResponse<VerificationResult>(response)
}

export async function backendSubmitOnboardingFeedback(
  accessToken: string,
  assignmentId: string,
  body: OnboardingFeedbackRequest
): Promise<void> {
  const response = await fetch(
    getApiUrl(`/onboarding/me/assignments/${assignmentId}/feedback`),
    authorized(accessToken, { method: 'POST', body: JSON.stringify(body) })
  )
  return handleResponse<void>(response)
}

// ── glossary ─────────────────────────────────────────────────────────────────

export async function backendListGlossaryTerms(accessToken: string): Promise<GlossaryTermListResponse> {
  const response = await backendFetch(getApiUrl('/glossary'), authorized(accessToken, { method: 'GET' }))
  return handleResponse<GlossaryTermListResponse>(response)
}

export async function backendCreateGlossaryTerm(
  accessToken: string,
  body: CreateGlossaryTermRequest
): Promise<GlossaryTerm> {
  const response = await fetch(
    getApiUrl('/glossary'),
    authorized(accessToken, { method: 'POST', body: JSON.stringify(body) })
  )
  return handleResponse<GlossaryTerm>(response)
}

export async function backendUpdateGlossaryTerm(
  accessToken: string,
  termId: string,
  body: UpdateGlossaryTermRequest
): Promise<GlossaryTerm> {
  const response = await fetch(
    getApiUrl(`/glossary/${termId}`),
    authorized(accessToken, { method: 'PATCH', body: JSON.stringify(body) })
  )
  return handleResponse<GlossaryTerm>(response)
}

export async function backendDeleteGlossaryTerm(accessToken: string, termId: string): Promise<void> {
  const response = await backendFetch(getApiUrl(`/glossary/${termId}`), authorized(accessToken, { method: 'DELETE' }))
  return handleResponse<void>(response)
}
