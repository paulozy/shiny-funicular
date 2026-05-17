import { ErrorResponse } from '@/lib/types/auth'
import {
  CodeTemplate,
  GenerateTemplateRequest,
  ListTemplatesParams,
  PinTemplateRequest,
  TemplateAcceptedResponse,
  TemplateListResponse,
} from '@/lib/types/template'

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api/v1'

function getApiUrl(path: string): string {
  return `${API_BASE_URL}${path}`
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error: ErrorResponse = await response.json().catch(() => ({
      error: `http_${response.status}`,
    }))
    const err = new Error(error.error_description || error.message || error.error)
    ;(err as unknown as { statusCode: number }).statusCode = response.status
    ;(err as unknown as { errorResponse: ErrorResponse }).errorResponse = error
    throw err
  }
  if (response.status === 204) return undefined as unknown as T
  return response.json()
}

export async function backendListTemplates(
  accessToken: string,
  params?: ListTemplatesParams
): Promise<TemplateListResponse> {
  const url = new URL(getApiUrl('/templates'))
  if (params?.pinned !== undefined) url.searchParams.set('pinned', String(params.pinned))
  if (params?.status) url.searchParams.set('status', params.status)
  if (params?.limit !== undefined) url.searchParams.set('limit', String(params.limit))
  if (params?.offset !== undefined) url.searchParams.set('offset', String(params.offset))

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return handleResponse<TemplateListResponse>(response)
}

export async function backendGetTemplate(
  accessToken: string,
  templateId: string
): Promise<CodeTemplate> {
  const response = await fetch(getApiUrl(`/templates/${templateId}`), {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return handleResponse<CodeTemplate>(response)
}

export async function backendGenerateTemplate(
  accessToken: string,
  body: GenerateTemplateRequest
): Promise<TemplateAcceptedResponse> {
  const response = await fetch(getApiUrl('/templates'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  })
  return handleResponse<TemplateAcceptedResponse>(response)
}

export async function backendGenerateRepoTemplate(
  accessToken: string,
  repoId: string,
  body: GenerateTemplateRequest
): Promise<TemplateAcceptedResponse> {
  const response = await fetch(getApiUrl(`/repositories/${repoId}/templates`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  })
  return handleResponse<TemplateAcceptedResponse>(response)
}

export async function backendPinTemplate(
  accessToken: string,
  templateId: string,
  body: PinTemplateRequest
): Promise<CodeTemplate> {
  const response = await fetch(getApiUrl(`/templates/${templateId}/pin`), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  })
  return handleResponse<CodeTemplate>(response)
}
