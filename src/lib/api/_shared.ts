import { ErrorResponse } from '@/lib/types/auth'

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api/v1'

export function getApiUrl(path: string): string {
  return `${API_BASE_URL}${path}`
}

export async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error: ErrorResponse = await response.json().catch(() => ({
      error: `http_${response.status}`,
    }))
    const err = new Error(error.error_description || error.message || error.error)
    ;(err as any).statusCode = response.status
    ;(err as any).errorResponse = error
    throw err
  }

  if (response.status === 204) {
    return undefined as any
  }

  return response.json()
}
