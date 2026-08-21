import 'server-only'
import {
  CreateInviteRequest,
  CreateInviteResult,
  InviteListResponse,
  MemberListResponse,
} from '@/lib/types/organization-members'
import { UserRole } from '@/lib/types/auth'
import { getApiUrl, handleResponse } from './_shared'

function authHeaders(accessToken: string, json = false): HeadersInit {
  const headers: Record<string, string> = { Authorization: `Bearer ${accessToken}` }
  if (json) headers['Content-Type'] = 'application/json'
  return headers
}

export async function backendListMembers(accessToken: string): Promise<MemberListResponse> {
  const response = await fetch(getApiUrl('/organizations/members'), {
    method: 'GET',
    headers: authHeaders(accessToken),
  })
  return handleResponse<MemberListResponse>(response)
}

export async function backendUpdateMemberRole(
  accessToken: string,
  userID: string,
  role: UserRole
): Promise<void> {
  const response = await fetch(getApiUrl(`/organizations/members/${userID}`), {
    method: 'PATCH',
    headers: authHeaders(accessToken, true),
    body: JSON.stringify({ role }),
  })
  return handleResponse<void>(response)
}

export async function backendRemoveMember(accessToken: string, userID: string): Promise<void> {
  const response = await fetch(getApiUrl(`/organizations/members/${userID}`), {
    method: 'DELETE',
    headers: authHeaders(accessToken),
  })
  return handleResponse<void>(response)
}

export async function backendListInvites(accessToken: string): Promise<InviteListResponse> {
  const response = await fetch(getApiUrl('/organizations/invites'), {
    method: 'GET',
    headers: authHeaders(accessToken),
  })
  return handleResponse<InviteListResponse>(response)
}

export async function backendCreateInvite(
  accessToken: string,
  body: CreateInviteRequest
): Promise<CreateInviteResult> {
  const response = await fetch(getApiUrl('/organizations/invites'), {
    method: 'POST',
    headers: authHeaders(accessToken, true),
    body: JSON.stringify(body),
  })
  return handleResponse<CreateInviteResult>(response)
}

export async function backendRevokeInvite(accessToken: string, inviteID: string): Promise<void> {
  const response = await fetch(getApiUrl(`/organizations/invites/${inviteID}`), {
    method: 'DELETE',
    headers: authHeaders(accessToken),
  })
  return handleResponse<void>(response)
}
