import { ErrorResponse } from '@/lib/types/auth'
import {
  GenerateEmbeddingsRequest,
  JobResponse,
  SemanticSearchParams,
  SemanticSearchResponse,
} from '@/lib/types/search'
import { buildSemanticSearchQuery } from '@/lib/search'

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
    ;(err as any).statusCode = response.status
    ;(err as any).errorResponse = error
    throw err
  }

  if (response.status === 204) {
    return undefined as any
  }

  return response.json()
}

export async function backendSemanticSearch(
  accessToken: string,
  repoId: string,
  params: SemanticSearchParams
): Promise<SemanticSearchResponse> {
  const query = buildSemanticSearchQuery(params)
  const response = await fetch(getApiUrl(`/repositories/${repoId}/search?${query}`), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  return handleResponse<SemanticSearchResponse>(response)
}

export async function backendSemanticSearchStream(
  accessToken: string,
  repoId: string,
  params: SemanticSearchParams
): Promise<Response> {
  const query = buildSemanticSearchQuery({ ...params, synthesize: true })
  return fetch(getApiUrl(`/repositories/${repoId}/search?${query}`), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'text/event-stream',
    },
  })
}

export async function backendGenerateEmbeddings(
  accessToken: string,
  repoId: string,
  body: GenerateEmbeddingsRequest
): Promise<JobResponse> {
  const response = await fetch(getApiUrl(`/repositories/${repoId}/embeddings`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  })

  return handleResponse<JobResponse>(response)
}
