import { ErrorResponse } from '@/lib/types/auth'
import {
  DocGenerationAcceptedResponse,
  DocGenerationDetail,
  DocGenerationListResponse,
  DocGenerationStatus,
  GenerateDocsRequest,
} from '@/lib/types/docs'

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

export async function backendListDocsForRepo(
  accessToken: string,
  repoId: string,
  params?: { status?: DocGenerationStatus }
): Promise<DocGenerationListResponse> {
  const url = new URL(getApiUrl(`/repositories/${repoId}/docs`))
  if (params?.status) url.searchParams.set('status', params.status)
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return handleResponse<DocGenerationListResponse>(response)
}

export async function backendGetDoc(
  accessToken: string,
  docId: string
): Promise<DocGenerationDetail> {
  const response = await fetch(getApiUrl(`/docs/${docId}`), {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return handleResponse<DocGenerationDetail>(response)
}

export async function backendGenerateDocs(
  accessToken: string,
  repoId: string,
  body: GenerateDocsRequest
): Promise<DocGenerationAcceptedResponse> {
  const response = await fetch(getApiUrl(`/repositories/${repoId}/docs/generate`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  })
  return handleResponse<DocGenerationAcceptedResponse>(response)
}
