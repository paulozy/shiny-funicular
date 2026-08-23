import { ContributorListResponse } from '@/lib/types/contributor'
import { backendFetch, getApiUrl, handleResponse } from './_shared'

export async function backendListContributors(
  accessToken: string,
  repoId: string
): Promise<ContributorListResponse> {
  const response = await backendFetch(getApiUrl(`/repositories/${repoId}/contributors`), {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  return handleResponse<ContributorListResponse>(response)
}
