import { OrganizationConfigResponse, UpdateOrganizationConfigRequest } from '@/lib/types/organization'
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

export async function backendGetOrganizationConfig(
  accessToken: string
): Promise<OrganizationConfigResponse> {
  const response = await fetch(getApiUrl('/organizations/configs'), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  return handleResponse<OrganizationConfigResponse>(response)
}

export async function backendUpdateOrganizationConfig(
  accessToken: string,
  body: UpdateOrganizationConfigRequest
): Promise<OrganizationConfigResponse> {
  const response = await fetch(getApiUrl('/organizations/configs'), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  })

  return handleResponse<OrganizationConfigResponse>(response)
}
