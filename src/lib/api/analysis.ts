import { AnalysisListResponse, AnalysisStatus, AnalysisType } from '@/lib/types/analysis'
import { AnalysisListResponseSchema } from '@/lib/types/analysis.schema'
import { getApiUrl, handleResponse, parseOrThrow } from './_shared'

export async function backendListAnalyses(
  accessToken: string,
  repoId: string,
  params?: { limit?: number; offset?: number; type?: AnalysisType; status?: AnalysisStatus }
): Promise<AnalysisListResponse> {
  const url = new URL(getApiUrl(`/repositories/${repoId}/analyses`))
  if (params?.limit !== undefined) url.searchParams.set('limit', String(params.limit))
  if (params?.offset !== undefined) url.searchParams.set('offset', String(params.offset))
  if (params?.type) url.searchParams.set('type', params.type)
  if (params?.status) url.searchParams.set('status', params.status)

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
