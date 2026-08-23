import { NextRequest, NextResponse } from 'next/server'
import { getAccessTokenCookie } from '@/lib/cookies'
import { backendRequestPullRequestChanges } from '@/lib/api/pull_requests'
import { BackendError } from '@/lib/api/_shared'
import { withTraceId } from '@/lib/logger'

interface RouteContext {
  params: Promise<{ id: string; pr_number: string }>
}

// Submits a review verdict on the repository's host. A 501 from the backend
// means that host has no equivalent action, not that the call failed.
export async function POST(request: NextRequest, context: RouteContext) {
  const log = withTraceId(request.headers)
  try {
    const token = await getAccessTokenCookie()
    if (!token) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const { id, pr_number } = await context.params
    const prNumber = Number(pr_number)
    if (!Number.isInteger(prNumber) || prNumber <= 0) {
      return NextResponse.json({ error: 'invalid_pr_number' }, { status: 400 })
    }

    const payload = await request.json().catch(() => ({}))
    await backendRequestPullRequestChanges(token, id, prNumber, typeof payload?.body === 'string' ? payload.body : undefined)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    const isBackend = error instanceof BackendError
    const statusCode = isBackend ? error.statusCode : 500
    const backendCode = isBackend ? error.errorResponse?.error : undefined
    const message = error instanceof Error ? error.message : 'unknown_error'
    log.error({ status: statusCode, error_code: backendCode }, 'request_changes_route_error')
    return NextResponse.json(
      { error: backendCode || 'server_error', message },
      { status: statusCode }
    )
  }
}
