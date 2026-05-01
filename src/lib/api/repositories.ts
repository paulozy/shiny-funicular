import { ErrorResponse } from '@/lib/types/auth'
import {
  BackendRepositoryListResponse,
  BackendRepositoryResponse,
  CreateRepositoryRequest,
  RepositoryListResponse,
  RepositoryResponse,
  RepositoryStats,
} from '@/lib/types/repository'

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

  const body = await handleResponse<BackendRepositoryListResponse>(response)
  return normalizeRepositoryList(body)
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
    body: JSON.stringify({
      url: body.url,
      description: body.description,
      is_public: body.is_public ?? (body.is_private === undefined ? undefined : !body.is_private),
    }),
  })

  const created = await handleResponse<BackendRepositoryResponse>(response)
  return normalizeRepository(created)
}

export function normalizeRepositoryList(body: BackendRepositoryListResponse): RepositoryListResponse {
  const rawItems = body.repositories || body.items || []
  return {
    repositories: rawItems.map(normalizeRepository),
    total: Number(body.total || rawItems.length),
    limit: Number(body.limit || rawItems.length),
    offset: Number(body.offset || 0),
  }
}

function normalizeRepositoryStats(stats?: Partial<RepositoryStats> | null): RepositoryStats {
  return {
    total_analyses: Number(stats?.total_analyses || 0),
    latest_quality_score: Number(stats?.latest_quality_score || 0),
    has_analysis: Boolean(stats?.has_analysis),
    last_analyzed_at: stats?.last_analyzed_at || null,
  }
}

export function normalizeRepository(repo: BackendRepositoryResponse): RepositoryResponse {
  const provider = repo.provider || repo.type || 'custom'
  return {
    id: repo.id,
    name: repo.name,
    full_name: repo.full_name || repo.name,
    description: repo.description,
    url: repo.url,
    provider,
    type: repo.type || provider,
    is_private: repo.is_private ?? !repo.is_public,
    is_public: repo.is_public,
    metadata: repo.metadata || {},
    sync_status: repo.sync_status,
    analysis_status: repo.analysis_status ?? null,
    reviews_count: repo.reviews_count ?? null,
    stats: normalizeRepositoryStats(repo.stats),
    created_at: repo.created_at,
    updated_at: repo.updated_at,
    organization_id: repo.organization_id,
  }
}
