export type UserRole = 'admin' | 'maintainer' | 'developer' | 'viewer'

export interface OrganizationInfo {
  id: string
  name: string
  slug: string
  role: UserRole
}

export interface UserInfo {
  id: string
  email: string
  full_name: string
  role: UserRole
  organization: OrganizationInfo | null
}

export interface TokenResponse {
  access_token: string
  token_type: 'Bearer'
  expires_in: number
  refresh_token: string
  refresh_expires_in: number
  user: UserInfo
  organization: OrganizationInfo
}

export interface OrganizationSelectionResponse {
  requires_organization_selection: true
  login_ticket: string
  organizations: OrganizationInfo[]
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  full_name: string
  password: string
  organization_name?: string
  organization_slug?: string
}

export interface SelectOrganizationRequest {
  login_ticket: string
  organization_id: string
}

export interface RefreshRequest {
  refresh_token: string
}

export interface ErrorResponse {
  error: string
  error_description?: string
  message?: string
}

export interface NormalizedError {
  code: string
  message: string
}

export function normalizeAuthError(raw: unknown): NormalizedError {
  if (!raw || typeof raw !== 'object') {
    return { code: 'unknown_error', message: 'Erro desconhecido' }
  }

  const obj = raw as Record<string, unknown>
  const error = String(obj.error ?? obj.code ?? 'unknown_error')
  const message =
    String(obj.error_description ?? obj.message ?? obj.detail ?? 'Erro desconhecido').substring(0, 200) || 'Erro desconhecido'

  return { code: error, message }
}

const ERROR_MESSAGES: Record<string, string> = {
  authentication_failed: 'E-mail ou senha incorretos',
  invalid_request: 'Dados inválidos',
  invalid_grant: 'Token expirado, faça login novamente',
  registration_failed: 'Não foi possível criar a conta',
  organization_selection_failed: 'Não foi possível selecionar a organização',
  no_ticket: 'Sessão expirada, faça login novamente',
  no_refresh_token: 'Sessão expirada, faça login novamente',
  session_expired: 'Sessão expirada, faça login novamente',
  oauth_authentication_failed: 'Autenticação OAuth falhou',
  unauthorized: 'Não autorizado',
  unknown_error: 'Erro desconhecido',
}

export function getErrorMessage(code: string, fallback?: string): string {
  return ERROR_MESSAGES[code] ?? fallback ?? ERROR_MESSAGES.unknown_error
}
