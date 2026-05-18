import { ErrorResponse } from '@/lib/types/auth'
import {
  CreateRepositoryRelationshipRequest,
  GetGraphParams,
  RepositoryGraphEdge,
  RepositoryGraphResponse,
  UpdateRepositoryRelationshipRequest,
} from '@/lib/types/graph'

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

export async function backendGetGraph(
  accessToken: string,
  params?: GetGraphParams
): Promise<RepositoryGraphResponse> {
  const url = new URL(getApiUrl('/repositories/graph'))
  if (params?.repository_id) url.searchParams.set('repository_id', params.repository_id)
  if (params?.kind) url.searchParams.set('kind', params.kind)
  if (params?.source) url.searchParams.set('source', params.source)
  if (params?.include_metadata !== undefined) {
    url.searchParams.set('include_metadata', String(params.include_metadata))
  }
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return handleResponse<RepositoryGraphResponse>(response)
}

export async function backendCreateRelationship(
  accessToken: string,
  body: CreateRepositoryRelationshipRequest
): Promise<RepositoryGraphEdge> {
  const response = await fetch(getApiUrl('/repository-relationships'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  })
  return handleResponse<RepositoryGraphEdge>(response)
}

export async function backendUpdateRelationship(
  accessToken: string,
  id: string,
  body: UpdateRepositoryRelationshipRequest
): Promise<RepositoryGraphEdge> {
  const response = await fetch(getApiUrl(`/repository-relationships/${id}`), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  })
  return handleResponse<RepositoryGraphEdge>(response)
}

export async function backendDeleteRelationship(accessToken: string, id: string): Promise<void> {
  const response = await fetch(getApiUrl(`/repository-relationships/${id}`), {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  await handleResponse<void>(response)
}
