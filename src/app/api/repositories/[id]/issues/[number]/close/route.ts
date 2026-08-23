import { NextRequest, NextResponse } from 'next/server'
import { getAccessTokenCookie } from '@/lib/cookies'
import { backendCloseIssue } from '@/lib/api/issues'
import { BackendError } from '@/lib/api/_shared'
import { withTraceId } from '@/lib/logger'

interface RouteContext {
  params: Promise<{ id: string; number: string }>
}

// Closes an issue on the repository's host. The backend applies the role gate
// and the repository-ownership check; this only forwards the caller's session.
export async function POST(request: NextRequest, context: RouteContext) {
  const log = withTraceId(request.headers)
  try {
    const token = await getAccessTokenCookie()
    if (!token) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const { id, number } = await context.params
    const issueNumber = Number(number)
    if (!Number.isInteger(issueNumber) || issueNumber <= 0) {
      return NextResponse.json({ error: 'invalid_issue_number' }, { status: 400 })
    }

    await backendCloseIssue(token, id, issueNumber)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    const isBackend = error instanceof BackendError
    const statusCode = isBackend ? error.statusCode : 500
    const backendCode = isBackend ? error.errorResponse?.error : undefined
    const message = error instanceof Error ? error.message : 'unknown_error'
    log.error({ status: statusCode, error_code: backendCode }, 'close_issue_route_error')
    return NextResponse.json(
      { error: backendCode || 'server_error', message },
      { status: statusCode }
    )
  }
}
