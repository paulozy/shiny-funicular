import { NextResponse } from 'next/server'
import { normalizeAuthError } from '@/lib/types/auth'

/**
 * Shared error wrapper for BFF Route Handlers. Mirrors the inline pattern in
 * `src/app/api/repositories/route.ts` so new route handlers stay consistent
 * without copy/pasting the same try/catch block 30 times.
 */
export function bffError(error: unknown): NextResponse {
  type ErrorWithStatus = {
    statusCode?: number
    errorResponse?: { error?: string }
  }
  const err = error as ErrorWithStatus
  const normalized = normalizeAuthError(
    error instanceof Error
      ? {
          error: err.statusCode === 401 ? 'authentication_failed' : err.errorResponse?.error || 'server_error',
          error_description: error.message,
        }
      : error
  )
  const statusCode = err.statusCode || 500
  return NextResponse.json(
    {
      error: normalized.code,
      message: normalized.message,
    },
    { status: statusCode }
  )
}
