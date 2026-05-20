import { AnalysisListResponse } from '@/lib/types/analysis'
import { getApiUrl, handleResponse } from './_shared'

export async function backendListAnalyses(
  accessToken: string,
  repoId: string,
  params?: { limit?: number; offset?: number }
): Promise<AnalysisListResponse> {
  const url = new URL(getApiUrl(`/repositories/${repoId}/analyses`))
  if (params?.limit !== undefined) url.searchParams.set('limit', String(params.limit))
  if (params?.offset !== undefined) url.searchParams.set('offset', String(params.offset))

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  return handleResponse<AnalysisListResponse>(response)
}
