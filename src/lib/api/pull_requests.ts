import {
  CreatePullRequestReviewRequest,
  CreatePullRequestReviewResult,
  PullRequestDetailResponse,
  PullRequestListResponse,
} from '@/lib/types/pull_request'
import { getApiUrl, handleResponse } from './_shared'

/** Response of a queued review job (backend returns 202 with this shape). */
export interface PullRequestReviewJobResponse {
  status: string
  type: string
  target: string
}

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

export async function backendAnalyzePullRequest(
  accessToken: string,
  repoId: string,
  prNumber: number
): Promise<PullRequestReviewJobResponse> {
  const response = await fetch(
    getApiUrl(`/repositories/${repoId}/pull-requests/${prNumber}/analyze`),
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  return handleResponse<PullRequestReviewJobResponse>(response)
}

export async function backendCreatePullRequestReview(
  accessToken: string,
  repoId: string,
  prNumber: number,
  payload: CreatePullRequestReviewRequest
): Promise<CreatePullRequestReviewResult> {
  const response = await fetch(
    getApiUrl(`/repositories/${repoId}/pull-requests/${prNumber}/reviews`),
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  )

  return handleResponse<CreatePullRequestReviewResult>(response)
}
