import { PullRequestDetailResponse, PullRequestListResponse } from '@/lib/types/pull_request'
import { backendFetch, getApiUrl, handleResponse } from './_shared'

export async function backendListPullRequests(
  accessToken: string,
  repoId: string
): Promise<PullRequestListResponse> {
  const response = await backendFetch(getApiUrl(`/repositories/${repoId}/pull-requests`), {
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

/**
 * The two review verdicts.
 *
 * The backend answers 501 `unsupported_capability` when the repository's host
 * has no equivalent action — GitLab has no portable "request changes". Callers
 * should hide the affordance up front (see `supportsRequestChanges`) rather
 * than rely on the error.
 */
export async function backendApprovePullRequest(
  accessToken: string,
  repoId: string,
  prNumber: number,
  body?: string
): Promise<void> {
  await submitReview(accessToken, repoId, prNumber, 'approve', body)
}

export async function backendRequestPullRequestChanges(
  accessToken: string,
  repoId: string,
  prNumber: number,
  body?: string
): Promise<void> {
  await submitReview(accessToken, repoId, prNumber, 'request-changes', body)
}

async function submitReview(
  accessToken: string,
  repoId: string,
  prNumber: number,
  action: 'approve' | 'request-changes',
  body?: string
): Promise<void> {
  const response = await backendFetch(
    getApiUrl(`/repositories/${repoId}/pull-requests/${prNumber}/${action}`),
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ body: body ?? '' }),
    }
  )

  await handleResponse<void>(response)
}
