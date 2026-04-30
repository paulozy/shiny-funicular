import {
  LoginRequest,
  RegisterRequest,
  SelectOrganizationRequest,
  TokenResponse,
  OrganizationSelectionResponse,
  UserInfo,
  ErrorResponse,
} from '@/lib/types/auth'

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

export async function backendLogin(body: LoginRequest): Promise<TokenResponse | OrganizationSelectionResponse> {
  const response = await fetch(getApiUrl('/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return handleResponse<TokenResponse | OrganizationSelectionResponse>(response)
}

export async function backendRegister(body: RegisterRequest): Promise<TokenResponse> {
  const response = await fetch(getApiUrl('/auth/register'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return handleResponse<TokenResponse>(response)
}

export async function backendSelectOrg(body: SelectOrganizationRequest): Promise<TokenResponse> {
  const response = await fetch(getApiUrl('/auth/select-organization'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return handleResponse<TokenResponse>(response)
}

export async function backendRefresh(refreshToken: string): Promise<TokenResponse> {
  const response = await fetch(getApiUrl('/auth/refresh'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })

  return handleResponse<TokenResponse>(response)
}

export async function backendLogout(accessToken: string): Promise<void> {
  try {
    const response = await fetch(getApiUrl('/auth/logout'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok && response.status !== 204) {
      console.error('Logout failed', response.status)
    }
  } catch (error) {
    console.error('Logout error:', error)
  }
}

export async function backendGetMe(accessToken: string): Promise<UserInfo> {
  const response = await fetch(getApiUrl('/users/me'), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  return handleResponse<UserInfo>(response)
}

export async function backendOAuthCallback(
  provider: string,
  code: string,
  state: string
): Promise<TokenResponse> {
  const response = await fetch(getApiUrl(`/auth/${provider}/callback?code=${code}&state=${state}`), {
    method: 'GET',
  })

  return handleResponse<TokenResponse>(response)
}

export function getOAuthRedirectURL(provider: string, organizationName?: string): string {
  const params = new URLSearchParams()
  if (organizationName) {
    params.append('organization_name', organizationName)
  }
  return `${API_BASE_URL}/auth/${provider}?${params.toString()}`
}
