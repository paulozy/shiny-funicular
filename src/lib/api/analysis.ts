import { AnalysisListResponse } from '@/lib/types/analysis'
import { AnalysisListResponseSchema } from '@/lib/types/analysis.schema'
import { getApiUrl, handleResponse, parseOrThrow } from './_shared'

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

  const payload = await handleResponse<unknown>(response)
  return parseOrThrow(AnalysisListResponseSchema, payload, {
    endpoint: 'GET /repositories/:id/analyses',
    repository_id: repoId,
  })
}
