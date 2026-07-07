import { NextRequest, NextResponse } from 'next/server'
import { getAccessTokenCookie } from '@/lib/cookies'
import { backendAnalyzePullRequest } from '@/lib/api/pull_requests'
import { BackendError } from '@/lib/api/_shared'
import { withTraceId } from '@/lib/logger'

interface RouteContext {
  params: Promise<{ id: string; pr_number: string }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  const log = withTraceId(request.headers)
  try {
    const token = await getAccessTokenCookie()
    if (!token) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const { id, pr_number } = await context.params
    const prNumber = Number(pr_number)
    if (!Number.isFinite(prNumber)) {
      return NextResponse.json({ error: 'invalid_pr_number' }, { status: 400 })
    }

    const response = await backendAnalyzePullRequest(token, id, prNumber)
    return NextResponse.json(response, { status: 202 })
  } catch (error) {
    const isBackend = error instanceof BackendError
    const statusCode = isBackend ? error.statusCode : 500
    const backendCode = isBackend ? error.errorResponse?.error : undefined
    const message = error instanceof Error ? error.message : 'unknown_error'
    log.error({ status: statusCode, error_code: backendCode }, 'pr_analyze_route_error')
    return NextResponse.json(
      { error: backendCode || 'server_error', message },
      { status: statusCode }
    )
  }
}
