import {
  PullRequestDetailResponse,
  PullRequestListResponse,
} from '@/lib/types/pull_request'
import { getApiUrl, handleResponse } from './_shared'

export async function backendListPullRequests(
  accessToken: string,
  repoId: string
): Promise<PullRequestListResponse> {
  const response = await fetch(getApiUrl(`/repositories/${repoId}/pull-requests`), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  return handleResponse<PullRequestListResponse>(response)
}

export async function backendGetPullRequest(
  accessToken: string,
  repoId: string,
  prNumber: number
): Promise<PullRequestDetailResponse> {
  const response = await fetch(
    getApiUrl(`/repositories/${repoId}/pull-requests/${prNumber}`),
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  return handleResponse<PullRequestDetailResponse>(response)
}
