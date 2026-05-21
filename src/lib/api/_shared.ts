import { ErrorResponse } from '@/lib/types/auth'
import { logger } from '@/lib/logger'
import type { ZodType } from 'zod'

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api/v1'

export function getApiUrl(path: string): string {
  return `${API_BASE_URL}${path}`
}

/**
 * Typed error thrown by the backend helpers. Carries the HTTP status (or the
 * synthetic 502 we use for schema mismatches) and the parsed backend error
 * envelope, if any. Route handlers can `instanceof BackendError` to convert
 * upstream errors into a meaningful HTTP response without untyped `as any`
 * casts on a plain Error.
 */
export class BackendError extends Error {
  readonly name = 'BackendError'
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly errorResponse?: ErrorResponse
  ) {
    super(message)
  }
}

export async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error: ErrorResponse = await response.json().catch(() => ({
      error: `http_${response.status}`,
    }))
    const message = error.error_description || error.message || error.error
    logger.error(
      { status: response.status, url: response.url, error_code: error.error },
      'backend_error'
    )
    throw new BackendError(message, response.status, error)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

/**
 * Validate an unknown payload against a zod schema and either return the
 * typed value or throw a 502 BackendError. The 502 is correct: a shape
 * mismatch from the upstream backend is, from the caller's perspective, a
 * bad gateway response. Used at the lib/api boundary so RSC pages and route
 * handlers both benefit.
 */
export function parseOrThrow<T>(
  schema: ZodType<T>,
  data: unknown,
  context: { endpoint: string; [key: string]: unknown }
): T {
  const result = schema.safeParse(data)
  if (result.success) return result.data

  const issuePreview = result.error.issues
    .slice(0, 3)
    .map((i) => `${i.path.join('.') || '<root>'}: ${i.message}`)
    .join('; ')
  logger.error(
    { ...context, issues: result.error.issues.slice(0, 5) },
    'backend_schema_mismatch'
  )
  const message = `backend_schema_mismatch at ${context.endpoint}: ${issuePreview}`
  throw new BackendError(message, 502, { error: 'backend_schema_mismatch' })
}
