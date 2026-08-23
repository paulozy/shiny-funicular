import 'server-only'
import {
  CreateTeamRequest,
  Team,
  UpdateTeamRequest,
  TeamListResponse,
  TeamMemberListResponse,
  TeamRole,
} from '@/lib/types/teams'
import { backendFetch, getApiUrl, handleResponse } from './_shared'

function authHeaders(accessToken: string, json = false): HeadersInit {
  const headers: Record<string, string> = { Authorization: `Bearer ${accessToken}` }
  if (json) headers['Content-Type'] = 'application/json'
  return headers
}

export async function backendListTeams(accessToken: string): Promise<TeamListResponse> {
  const response = await backendFetch(getApiUrl('/teams'), {
    method: 'GET',
    headers: authHeaders(accessToken),
  })
  return handleResponse<TeamListResponse>(response)
}

export async function backendCreateTeam(
  accessToken: string,
  body: CreateTeamRequest
): Promise<Team> {
  const response = await backendFetch(getApiUrl('/teams'), {
    method: 'POST',
    headers: authHeaders(accessToken, true),
    body: JSON.stringify(body),
  })
  return handleResponse<Team>(response)
}

export async function backendUpdateTeam(
  accessToken: string,
  teamID: string,
  body: UpdateTeamRequest
): Promise<Team> {
  const response = await backendFetch(getApiUrl(`/teams/${teamID}`), {
    method: 'PATCH',
    headers: authHeaders(accessToken, true),
    body: JSON.stringify(body),
  })
  return handleResponse<Team>(response)
}

export async function backendDeleteTeam(accessToken: string, teamID: string): Promise<void> {
  const response = await backendFetch(getApiUrl(`/teams/${teamID}`), {
    method: 'DELETE',
    headers: authHeaders(accessToken),
  })
  return handleResponse<void>(response)
}

export async function backendListTeamMembers(
  accessToken: string,
  teamID: string
): Promise<TeamMemberListResponse> {
  const response = await backendFetch(getApiUrl(`/teams/${teamID}/members`), {
    method: 'GET',
    headers: authHeaders(accessToken),
  })
  return handleResponse<TeamMemberListResponse>(response)
}

export async function backendAddTeamMember(
  accessToken: string,
  teamID: string,
  userID: string,
  role?: TeamRole
): Promise<void> {
  const response = await backendFetch(getApiUrl(`/teams/${teamID}/members`), {
    method: 'POST',
    headers: authHeaders(accessToken, true),
    body: JSON.stringify({ user_id: userID, role }),
  })
  return handleResponse<void>(response)
}

export async function backendRemoveTeamMember(
  accessToken: string,
  teamID: string,
  userID: string
): Promise<void> {
  const response = await backendFetch(getApiUrl(`/teams/${teamID}/members/${userID}`), {
    method: 'DELETE',
    headers: authHeaders(accessToken),
  })
  return handleResponse<void>(response)
}

/** A null teamID clears ownership — "unowned" is a state, not an error. */
export async function backendSetRepositoryOwner(
  accessToken: string,
  repoID: string,
  teamID: string | null
): Promise<void> {
  const response = await backendFetch(getApiUrl(`/repositories/${repoID}/owner`), {
    method: 'PUT',
    headers: authHeaders(accessToken, true),
    body: JSON.stringify({ team_id: teamID }),
  })
  return handleResponse<void>(response)
}
