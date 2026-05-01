import { CreateRepositoryRequest, RepositoryListResponse, RepositoryResponse } from '@/lib/types/repository'
import { ErrorResponse } from '@/lib/types/auth'

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

export async function backendGetRepositories(
  accessToken: string,
  params?: { limit?: number; offset?: number }
): Promise<RepositoryListResponse> {
  const url = new URL(getApiUrl('/repositories'))
  if (params?.limit) url.searchParams.set('limit', params.limit.toString())
  if (params?.offset) url.searchParams.set('offset', params.offset.toString())

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  return handleResponse<RepositoryListResponse>(response)
}

export async function backendCreateRepository(
  accessToken: string,
  body: CreateRepositoryRequest
): Promise<RepositoryResponse> {
  const response = await fetch(getApiUrl('/repositories'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  })

  return handleResponse<RepositoryResponse>(response)
}
