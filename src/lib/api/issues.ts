import { IssueListResponse } from '@/lib/types/issue'
import { backendFetch, getApiUrl, handleResponse } from './_shared'

export async function backendListIssues(
  accessToken: string,
  repoId: string
): Promise<IssueListResponse> {
  const response = await backendFetch(getApiUrl(`/repositories/${repoId}/issues`), {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  return handleResponse<IssueListResponse>(response)
}

export async function backendCloseIssue(
  accessToken: string,
  repoId: string,
  issueNumber: number
): Promise<void> {
  const response = await backendFetch(
    getApiUrl(`/repositories/${repoId}/issues/${issueNumber}/close`),
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  )

  await handleResponse<void>(response)
}
